import {
  Contact,
  RelationshipEdge,
  CompanyAccount,
  GraphSnapshot,
  EdgeStrength,
  CSVColumnMapping,
  CSVImportOptions,
} from '../../../shared/contracts';

export interface ImportPreview {
  ownerMemberId: string;
  totalRows: number;
  validContacts: number;
  newAccountsDetected: number;
  duplicateCount: number;
  existingContactsMerged: number;
  parsedContacts: Contact[];
  newAccounts: CompanyAccount[];
  newEdges: RelationshipEdge[];
  detectedHeaders: string[];
  appliedMapping: CSVColumnMapping;
}

export interface HeaderDetectionResult {
  headerIndex: number;
  headers: string[];
  suggestedMapping: CSVColumnMapping;
  sampleRows: string[][];
  totalParsedRows: number;
}

export function parseCSVLines(text: string): string[][] {
  // Strip BOM if present
  const cleanText = text.replace(/^\uFEFF/, '');

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n' || char === '\r') {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField.trim());
        if (currentRow.length > 0 && currentRow.some((f) => f.length > 0)) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function matchHeaderColumn(headers: string[], patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = headers.find((h) => pattern.test(h.trim()));
    if (match) return match;
  }
  return '';
}

export function detectCSVHeaders(csvContent: string): HeaderDetectionResult {
  const rows = parseCSVLines(csvContent);
  if (rows.length === 0) {
    throw new Error('The CSV file is empty or could not be parsed.');
  }

  // Find header row (scans first 15 rows for recognized keywords)
  let headerIndex = -1;
  const headerKeywords = [
    /first\s*name/i,
    /given\s*name/i,
    /last\s*name/i,
    /company/i,
    /employer/i,
    /organization/i,
    /position/i,
    /job\s*title/i,
    /title/i,
    /email/i,
  ];

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    const matchCount = row.filter((cell) => headerKeywords.some((pattern) => pattern.test(cell))).length;
    if (matchCount >= 2) {
      headerIndex = i;
      break;
    }
  }

  // Fallback to first non-empty row if not detected
  if (headerIndex === -1) {
    headerIndex = 0;
  }

  const headers = rows[headerIndex];

  const suggestedMapping: CSVColumnMapping = {
    firstName: matchHeaderColumn(headers, [/first\s*name/i, /^first$/i, /given\s*name/i, /fname/i]),
    lastName: matchHeaderColumn(headers, [/last\s*name/i, /^last$/i, /family\s*name/i, /surname/i, /lname/i]),
    company: matchHeaderColumn(headers, [/company\s*name/i, /^company$/i, /employer/i, /organization/i, /account/i]),
    position: matchHeaderColumn(headers, [/position/i, /job\s*title/i, /^title$/i, /role/i, /occupation/i]),
    email: matchHeaderColumn(headers, [/email\s*address/i, /^email$/i, /work\s*email/i, /contact\s*email/i]),
    connectedOn: matchHeaderColumn(headers, [/connected\s*on/i, /connection\s*date/i, /connected\s*date/i, /created\s*at/i]),
    profileUrl: matchHeaderColumn(headers, [/profile\s*url/i, /linkedin\s*url/i, /^url$/i, /link/i]),
  };

  const sampleRows = rows.slice(headerIndex + 1, headerIndex + 6);

  return {
    headerIndex,
    headers,
    suggestedMapping,
    sampleRows,
    totalParsedRows: Math.max(0, rows.length - (headerIndex + 1)),
  };
}

export function normalizeConnectionsWithMapping(
  csvContent: string,
  options: CSVImportOptions,
  existingSnapshot: GraphSnapshot,
): ImportPreview {
  const { headerIndex, headers, suggestedMapping } = detectCSVHeaders(csvContent);
  const rows = parseCSVLines(csvContent);

  const appliedMapping: CSVColumnMapping = {
    firstName: options.mapping?.firstName || suggestedMapping.firstName,
    lastName: options.mapping?.lastName || suggestedMapping.lastName,
    company: options.mapping?.company || suggestedMapping.company,
    position: options.mapping?.position || suggestedMapping.position,
    email: options.mapping?.email || suggestedMapping.email,
    connectedOn: options.mapping?.connectedOn || suggestedMapping.connectedOn,
    profileUrl: options.mapping?.profileUrl || suggestedMapping.profileUrl,
  };

  const getColIdx = (colName: string): number => (colName ? headers.indexOf(colName) : -1);

  const fnIdx = getColIdx(appliedMapping.firstName);
  const lnIdx = getColIdx(appliedMapping.lastName);
  const compIdx = getColIdx(appliedMapping.company);
  const posIdx = getColIdx(appliedMapping.position);
  const emailIdx = getColIdx(appliedMapping.email);
  const connIdx = getColIdx(appliedMapping.connectedOn);
  const urlIdx = getColIdx(appliedMapping.profileUrl);

  const defaultStrength: EdgeStrength = options.defaultStrength || 'unknown';
  const ownerMemberId = options.ownerMemberId;

  // Identity maps for deduplication
  const existingContactsByEmail = new Map<string, Contact>();
  const existingContactsByNameCompany = new Map<string, Contact>();
  for (const c of existingSnapshot.contacts) {
    if (c.email) {
      existingContactsByEmail.set(c.email.trim().toLowerCase(), c);
    }
    const nameCompKey = `${c.name.trim().toLowerCase()}::${(c.companyName || '').trim().toLowerCase()}`;
    existingContactsByNameCompany.set(nameCompKey, c);
  }

  // Accounts map
  const existingAccountsByName = new Map<string, CompanyAccount>(
    existingSnapshot.accounts.map((a) => [a.name.trim().toLowerCase(), a]),
  );

  // Existing edge tracker to prevent duplicate edges between same owner and contact
  const existingEdgeSet = new Set<string>(
    existingSnapshot.edges.map((e) => `${e.sourceId}->${e.targetId}`),
  );

  const parsedContacts: Contact[] = [];
  const newAccounts: CompanyAccount[] = [];
  const newEdges: RelationshipEdge[] = [];
  let duplicateCount = 0;
  let existingContactsMerged = 0;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const firstName = fnIdx >= 0 ? row[fnIdx] || '' : '';
    const lastName = lnIdx >= 0 ? row[lnIdx] || '' : '';
    const fullName = `${firstName} ${lastName}`.trim();
    const company = compIdx >= 0 ? (row[compIdx] || '').trim() : '';
    const title = posIdx >= 0 ? (row[posIdx] || '').trim() : 'Professional';
    const email = emailIdx >= 0 ? (row[emailIdx] || '').trim().toLowerCase() : '';
    const profileUrl = urlIdx >= 0 ? (row[urlIdx] || '').trim() : '';
    const connectedOn = connIdx >= 0 ? (row[connIdx] || '').trim() : '';

    if (!fullName || fullName.length < 2) continue;

    // Check identity deduplication
    let existingContact: Contact | undefined;
    if (email && existingContactsByEmail.has(email)) {
      existingContact = existingContactsByEmail.get(email);
    } else {
      const key = `${fullName.toLowerCase()}::${company.toLowerCase()}`;
      if (existingContactsByNameCompany.has(key)) {
        existingContact = existingContactsByNameCompany.get(key);
      }
    }

    if (existingContact) {
      duplicateCount++;
      // Check if this owner has an edge to this existing contact
      const edgeKey = `${ownerMemberId}->${existingContact.id}`;
      if (!existingEdgeSet.has(edgeKey)) {
        // Merge! Add new edge from this owner to the existing contact
        newEdges.push({
          id: `edge_${ownerMemberId}_${existingContact.id}_${Math.random().toString(36).substring(2, 6)}`,
          sourceId: ownerMemberId,
          targetId: existingContact.id,
          edgeType: 'team_to_contact',
          ownerMemberId,
          strength: defaultStrength,
          evidence: [
            {
              id: `ev_csv_${Math.random().toString(36).substring(2, 7)}`,
              type: 'linkedin_connection',
              title: 'Imported Connection Match',
              description: connectedOn ? `Connected on ${connectedOn}` : 'Imported via CSV connection mapping',
              date: connectedOn || undefined,
              confidence: 'medium',
            },
          ],
        });
        existingEdgeSet.add(edgeKey);
        existingContactsMerged++;
      }
      continue;
    }

    // Determine or create Company Account
    let companyId: string | undefined = undefined;
    if (company) {
      const cleanCompanyName = company.replace(/,\s*(inc|llc|corp|corporation|ltd)\.?$/i, '').trim();
      const existingAcc = existingAccountsByName.get(cleanCompanyName.toLowerCase()) ||
                          existingAccountsByName.get(company.toLowerCase());

      if (existingAcc) {
        companyId = existingAcc.id;
      } else {
        const newAccId = `acc_import_${Math.random().toString(36).substring(2, 9)}`;
        const isLikelyBuyer = /revops|revenue|sales|gtm|operations/i.test(title);
        const domain = `${cleanCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

        const newAcc: CompanyAccount = {
          id: newAccId,
          name: cleanCompanyName,
          domain,
          industry: 'Software & Technology',
          employeeCount: '250+',
          fitScore: isLikelyBuyer ? 88 : 72,
          fitReason: `Imported account via network connection to ${fullName} (${title}).`,
          targetBuyerRoles: ['VP Sales', 'Head of RevOps'],
        };

        newAccounts.push(newAcc);
        existingAccountsByName.set(cleanCompanyName.toLowerCase(), newAcc);
        existingAccountsByName.set(company.toLowerCase(), newAcc);
        companyId = newAccId;
      }
    }

    const contactId = `con_import_${Math.random().toString(36).substring(2, 9)}`;
    const isTargetBuyer = /revops|sales ops|revenue operations|vice president of sales|head of sales|vp revenue/i.test(title);

    const contact: Contact = {
      id: contactId,
      name: fullName,
      title: title || 'Professional',
      companyName: company || 'Independent',
      companyId,
      email: email || undefined,
      linkedinUrl: profileUrl || undefined,
      isTargetBuyer,
    };

    parsedContacts.push(contact);

    // Register in deduplication maps for subsequent rows in this same file
    if (email) existingContactsByEmail.set(email, contact);
    existingContactsByNameCompany.set(`${fullName.toLowerCase()}::${company.toLowerCase()}`, contact);

    // Edge from owner -> contact
    const edgeKey = `${ownerMemberId}->${contactId}`;
    newEdges.push({
      id: `edge_${ownerMemberId}_${contactId}`,
      sourceId: ownerMemberId,
      targetId: contactId,
      edgeType: 'team_to_contact',
      ownerMemberId,
      strength: defaultStrength,
      evidence: [
        {
          id: `ev_csv_${Math.random().toString(36).substring(2, 7)}`,
          type: 'linkedin_connection',
          title: 'Imported LinkedIn Connection',
          description: connectedOn ? `Connected on ${connectedOn}` : 'Imported via CSV mapping',
          date: connectedOn || undefined,
          confidence: 'medium',
        },
      ],
    });
    existingEdgeSet.add(edgeKey);

    // Edge from contact -> company
    if (companyId) {
      newEdges.push({
        id: `edge_${contactId}_${companyId}`,
        sourceId: contactId,
        targetId: companyId,
        edgeType: 'contact_to_company',
        strength: 'strong',
        evidence: [],
      });
    }
  }

  return {
    ownerMemberId,
    totalRows: Math.max(0, rows.length - (headerIndex + 1)),
    validContacts: parsedContacts.length,
    newAccountsDetected: newAccounts.length,
    duplicateCount,
    existingContactsMerged,
    parsedContacts,
    newAccounts,
    newEdges,
    detectedHeaders: headers,
    appliedMapping,
  };
}

export function normalizeConnections(
  csvContent: string,
  ownerMemberId: string,
  existingSnapshot: GraphSnapshot,
): ImportPreview {
  return normalizeConnectionsWithMapping(
    csvContent,
    {
      ownerMemberId,
      defaultStrength: 'unknown',
    },
    existingSnapshot,
  );
}
