import { Contact, RelationshipEdge, CompanyAccount, GraphSnapshot } from '../../../shared/contracts';

export interface ImportPreview {
  ownerMemberId: string;
  totalRows: number;
  validContacts: number;
  newAccountsDetected: number;
  duplicateCount: number;
  parsedContacts: Contact[];
  newAccounts: CompanyAccount[];
  newEdges: RelationshipEdge[];
}

export function parseCSVLines(text: string): string[][] {
  // Strip BOM if present
  let cleanText = text.replace(/^\uFEFF/, '');

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

export function normalizeConnections(
  csvContent: string,
  ownerMemberId: string,
  existingSnapshot: GraphSnapshot,
): ImportPreview {
  const rows = parseCSVLines(csvContent);

  // Find header row (detecting First Name or Company)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    const row = rows[i].map((c) => c.toLowerCase());
    if (row.some((col) => col.includes('first name') || col.includes('company') || col.includes('position'))) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not identify a valid LinkedIn Connections header row in the uploaded CSV.');
  }

  const headers = rows[headerIndex].map((h) => h.toLowerCase());
  const firstNameIdx = headers.findIndex((h) => h.includes('first name'));
  const lastNameIdx = headers.findIndex((h) => h.includes('last name'));
  const companyIdx = headers.findIndex((h) => h.includes('company'));
  const positionIdx = headers.findIndex((h) => h.includes('position') || h.includes('title'));
  const emailIdx = headers.findIndex((h) => h.includes('email'));
  const urlIdx = headers.findIndex((h) => h.includes('url') || h.includes('profile'));
  const connectedOnIdx = headers.findIndex((h) => h.includes('connected on'));

  const existingContactNames = new Set(existingSnapshot.contacts.map((c) => c.name.toLowerCase()));
  const existingAccountsByName = new Map<string, CompanyAccount>(
    existingSnapshot.accounts.map((a) => [a.name.toLowerCase(), a]),
  );

  const parsedContacts: Contact[] = [];
  const newAccounts: CompanyAccount[] = [];
  const newEdges: RelationshipEdge[] = [];
  let duplicateCount = 0;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    const firstName = firstNameIdx >= 0 ? row[firstNameIdx] || '' : '';
    const lastName = lastNameIdx >= 0 ? row[lastNameIdx] || '' : '';
    const fullName = `${firstName} ${lastName}`.trim();
    const company = companyIdx >= 0 ? row[companyIdx] || '' : '';
    const title = positionIdx >= 0 ? row[positionIdx] || '' : 'Team Member';
    const email = emailIdx >= 0 ? row[emailIdx] || '' : '';
    const profileUrl = urlIdx >= 0 ? row[urlIdx] || '' : '';
    const connectedOn = connectedOnIdx >= 0 ? row[connectedOnIdx] || '' : '';

    if (!fullName || fullName.length < 2) continue;

    // Check duplicate
    if (existingContactNames.has(fullName.toLowerCase())) {
      duplicateCount++;
      continue;
    }

    // Determine or create account
    let companyId: string | undefined = undefined;
    if (company) {
      const existingAcc = existingAccountsByName.get(company.toLowerCase());
      if (existingAcc) {
        companyId = existingAcc.id;
      } else {
        const newAccId = `acc_import_${Math.random().toString(36).substring(2, 9)}`;
        const isLikelyBuyer = /revops|sales|revenue|operations|gtm/i.test(title);
        const newAcc: CompanyAccount = {
          id: newAccId,
          name: company,
          domain: `${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          industry: 'Software & Technology',
          employeeCount: '500+',
          fitScore: isLikelyBuyer ? 84 : 70,
          fitReason: 'Imported via network connection.',
          targetBuyerRoles: ['VP Sales', 'Head of RevOps'],
        };
        newAccounts.push(newAcc);
        existingAccountsByName.set(company.toLowerCase(), newAcc);
        companyId = newAccId;
      }
    }

    const contactId = `con_import_${Math.random().toString(36).substring(2, 9)}`;
    const isTargetBuyer = /revops|sales ops|revenue operations|vice president of sales|head of sales/i.test(title);

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

    // Edge from owner -> contact
    newEdges.push({
      id: `edge_${ownerMemberId}_${contactId}`,
      sourceId: ownerMemberId,
      targetId: contactId,
      edgeType: 'team_to_contact',
      ownerMemberId,
      strength: 'unknown',
      evidence: [
        {
          id: `ev_csv_${Math.random().toString(36).substring(2, 7)}`,
          type: 'linkedin_connection',
          title: 'Imported LinkedIn Connection',
          description: connectedOn ? `Connected on ${connectedOn}` : 'Imported via CSV',
          date: connectedOn || undefined,
          confidence: 'medium',
        },
      ],
    });

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
    totalRows: rows.length - (headerIndex + 1),
    validContacts: parsedContacts.length,
    newAccountsDetected: newAccounts.length,
    duplicateCount,
    parsedContacts,
    newAccounts,
    newEdges,
  };
}
