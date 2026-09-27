import React, { useState } from 'react';
import {
  GraphSnapshot,
  TeamMember,
  EdgeStrength,
  CSVColumnMapping,
} from '../../shared/contracts';
import {
  detectCSVHeaders,
  normalizeConnectionsWithMapping,
  ImportPreview,
  HeaderDetectionResult,
} from '../core/import/csv';
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  SlidersHorizontal,
  Table,
  ShieldAlert,
} from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  members: TeamMember[];
  currentSnapshot: GraphSnapshot;
  onImportComplete: (updatedSnapshot: GraphSnapshot) => void;
  onClose: () => void;
}

const SAMPLE_CSV_DATA = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
David,Kim,https://www.linkedin.com/in/davidkim-example,david.k@ramp.com,Ramp,VP Revenue Operations,14 Aug 2024
Rachel,Green,https://www.linkedin.com/in/rachelgreen-example,rachel@brex.com,Brex,Head of Global Sales Strategy,02 Jan 2025
Liam,O'Connor,https://www.linkedin.com/in/liamoconnor-example,,Ramp,Senior Infrastructure Architect,10 May 2023
Elena,Rostova,https://www.linkedin.com/in/elenarostova-example,elena@stripe.com,Stripe,Head of Global Revenue Operations,15 Mar 2024
Marcus,Vance,https://www.linkedin.com/in/marcusvance-example,,Figma,Director of Enterprise Sales,18 Nov 2024
`;

type WizardStep = 'upload' | 'mapping' | 'preview';

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  members,
  currentSnapshot,
  onImportComplete,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [selectedOwner, setSelectedOwner] = useState<string>(members[0]?.id || 'sahil');
  const [defaultStrength, setDefaultStrength] = useState<EdgeStrength>('unknown');
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [detectionResult, setDetectionResult] = useState<HeaderDetectionResult | null>(null);
  const [mapping, setMapping] = useState<CSVColumnMapping>({
    firstName: '',
    lastName: '',
    company: '',
    position: '',
    email: '',
    connectedOn: '',
    profileUrl: '',
  });
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessRawText = (text: string) => {
    setError(null);
    try {
      const detected = detectCSVHeaders(text);
      setDetectionResult(detected);
      setMapping(detected.suggestedMapping);
      setRawCsvText(text);
      setCurrentStep('mapping');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleProcessRawText(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    handleProcessRawText(SAMPLE_CSV_DATA);
  };

  const handleProceedToPreview = () => {
    setError(null);
    try {
      const result = normalizeConnectionsWithMapping(
        rawCsvText,
        {
          ownerMemberId: selectedOwner,
          defaultStrength,
          mapping,
        },
        currentSnapshot,
      );
      setPreview(result);
      setCurrentStep('preview');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error generating import preview');
    }
  };

  const handleConfirmMerge = () => {
    if (!preview) return;

    const updatedSnapshot: GraphSnapshot = {
      ...currentSnapshot,
      version: currentSnapshot.version + 1,
      contacts: [...currentSnapshot.contacts, ...preview.parsedContacts],
      accounts: [...currentSnapshot.accounts, ...preview.newAccounts],
      edges: [...currentSnapshot.edges, ...preview.newEdges],
    };

    onImportComplete(updatedSnapshot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#f0883e]" />
            <h3 className="text-sm font-bold text-white">Import Connections CSV</h3>
            <span className="text-[11px] text-[#8b949e] font-mono">
              (Step {currentStep === 'upload' ? '1/3' : currentStep === 'mapping' ? '2/3' : '3/3'})
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white p-1 rounded-md hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wizard Stepper Tabs */}
        <div className="px-5 py-2.5 bg-[#0d1117]/80 border-b border-[#30363d] flex items-center justify-between text-xs">
          <div
            className={`flex items-center gap-2 font-medium ${
              currentStep === 'upload' ? 'text-[#f0883e]' : 'text-[#8b949e]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              1
            </span>
            <span>Upload File</span>
          </div>

          <div className="h-[1px] w-8 bg-[#30363d]" />

          <div
            className={`flex items-center gap-2 font-medium ${
              currentStep === 'mapping' ? 'text-[#f0883e]' : 'text-[#8b949e]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              2
            </span>
            <span>Column Mapping</span>
          </div>

          <div className="h-[1px] w-8 bg-[#30363d]" />

          <div
            className={`flex items-center gap-2 font-medium ${
              currentStep === 'preview' ? 'text-[#f0883e]' : 'text-[#8b949e]'
            }`}
          >
            <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
              3
            </span>
            <span>Deduplication & Merge</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD */}
          {currentStep === 'upload' && (
            <div className="space-y-4">
              <p className="text-xs text-[#8b949e]">
                Upload an official LinkedIn Connection export or any standard contact CSV. Headers
                will be automatically detected and mapped.
              </p>

              {/* Owner selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-white">
                  Assign Connections to Teammate:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedOwner(m.id)}
                      className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                        selectedOwner === m.id
                          ? 'bg-[#f0883e]/15 border-[#f0883e] text-white shadow-xs'
                          : 'bg-[#0d1117] border-[#30363d] text-[#8b949e] hover:text-white'
                      }`}
                    >
                      <img src={m.avatar} alt={m.name} className="w-4 h-4 rounded-full" />
                      <span>{m.name}&apos;s Network</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload Zone */}
              <div className="border-2 border-dashed border-[#30363d] hover:border-[#f0883e]/50 rounded-xl p-6 text-center space-y-3 bg-[#0d1117]/50 transition-colors">
                <Upload className="w-8 h-8 text-[#8b949e] mx-auto" />
                <div className="space-y-1">
                  <label className="cursor-pointer px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg text-xs font-medium border border-[#30363d] inline-block transition-colors shadow-xs">
                    Select CSV File
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-[#8b949e]">or drop your Connections.csv here</p>
                </div>

                <div className="pt-2 border-t border-[#30363d]/60">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-xs text-[#f0883e] hover:text-[#d97706] font-medium inline-flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Load Sample LinkedIn Connections CSV (Ramp, Brex, Stripe)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {currentStep === 'mapping' && detectionResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Review Column Mappings</h4>
                  <p className="text-[11px] text-[#8b949e]">
                    Detected {detectionResult.totalParsedRows} rows. Confirm or adjust how columns match.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMapping(detectionResult.suggestedMapping)}
                  className="text-[11px] text-[#58a6ff] hover:underline"
                >
                  Reset to Auto-Detected
                </button>
              </div>

              {/* Mapping Grid */}
              <div className="grid grid-cols-2 gap-3 bg-[#0d1117] p-3.5 rounded-xl border border-[#30363d]">
                <div>
                  <label className="block text-[11px] font-medium text-white mb-1">
                    First Name <span className="text-[#f0883e]">*</span>
                  </label>
                  <select
                    value={mapping.firstName}
                    onChange={(e) => setMapping({ ...mapping, firstName: e.target.value })}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#f0883e]"
                  >
                    <option value="">-- None / Skip --</option>
                    {detectionResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white mb-1">
                    Last Name <span className="text-[#f0883e]">*</span>
                  </label>
                  <select
                    value={mapping.lastName}
                    onChange={(e) => setMapping({ ...mapping, lastName: e.target.value })}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#f0883e]"
                  >
                    <option value="">-- None / Skip --</option>
                    {detectionResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white mb-1">
                    Company / Employer <span className="text-[#f0883e]">*</span>
                  </label>
                  <select
                    value={mapping.company}
                    onChange={(e) => setMapping({ ...mapping, company: e.target.value })}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#f0883e]"
                  >
                    <option value="">-- None / Skip --</option>
                    {detectionResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white mb-1">
                    Job Title / Position
                  </label>
                  <select
                    value={mapping.position}
                    onChange={(e) => setMapping({ ...mapping, position: e.target.value })}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#f0883e]"
                  >
                    <option value="">-- None / Skip --</option>
                    {detectionResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white mb-1">
                    Email Address
                  </label>
                  <select
                    value={mapping.email}
                    onChange={(e) => setMapping({ ...mapping, email: e.target.value })}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#f0883e]"
                  >
                    <option value="">-- None / Skip --</option>
                    {detectionResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-white mb-1">
                    Connected Date
                  </label>
                  <select
                    value={mapping.connectedOn}
                    onChange={(e) => setMapping({ ...mapping, connectedOn: e.target.value })}
                    className="w-full bg-[#161b22] border border-[#30363d] rounded-md px-2 py-1.5 text-xs text-white focus:outline-hidden focus:border-[#f0883e]"
                  >
                    <option value="">-- None / Skip --</option>
                    {detectionResult.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sample Rows Preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-[#8b949e] flex items-center gap-1">
                  <Table className="w-3.5 h-3.5" />
                  First Rows Sample Preview:
                </span>
                <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-2 max-h-32 overflow-x-auto text-[11px] font-mono text-[#c9d1d9] space-y-1">
                  {detectionResult.sampleRows.slice(0, 3).map((row, rIdx) => (
                    <div key={rIdx} className="truncate border-b border-[#21262d] pb-1 last:border-0">
                      {row.join(' | ')}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & DEDUPLICATION */}
          {currentStep === 'preview' && preview && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Import Analysis & Deduplication Summary</span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl">
                  <div className="text-base font-bold text-white">{preview.validContacts}</div>
                  <div className="text-[10px] text-[#8b949e]">New Contacts</div>
                </div>
                <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl">
                  <div className="text-base font-bold text-[#f0883e]">{preview.newAccountsDetected}</div>
                  <div className="text-[10px] text-[#8b949e]">New Accounts</div>
                </div>
                <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl">
                  <div className="text-base font-bold text-[#8b949e]">{preview.duplicateCount}</div>
                  <div className="text-[10px] text-[#8b949e]">Deduplicated</div>
                </div>
                <div className="p-2.5 bg-[#0d1117] border border-[#30363d] rounded-xl">
                  <div className="text-base font-bold text-emerald-400">{preview.existingContactsMerged}</div>
                  <div className="text-[10px] text-[#8b949e]">Cross-Merged</div>
                </div>
              </div>

              {/* Relationship Strength Option */}
              <div className="p-3 bg-[#0d1117] border border-[#30363d] rounded-xl space-y-1.5">
                <label className="block text-xs font-semibold text-white">
                  Baseline Connection Warmth for Imported Edges:
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {(['unknown', 'acquaintance', 'strong', 'self_reported_close'] as EdgeStrength[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setDefaultStrength(st)}
                      className={`py-1.5 px-2 rounded-lg border text-center font-medium capitalize transition-all ${
                        defaultStrength === st
                          ? 'bg-[#f0883e]/20 border-[#f0883e] text-white shadow-xs'
                          : 'bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-white'
                      }`}
                    >
                      {st.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[#8b949e]">
                  Per PYRGRAPH data invariants: &quot;unknown&quot; is recommended for raw LinkedIn connections with no verified co-working evidence.
                </p>
              </div>

              {/* Parsed Contacts List Preview */}
              <div className="text-[11px] text-[#8b949e] space-y-1.5">
                <span className="font-semibold text-white">
                  Contacts Ready to Merge ({preview.parsedContacts.length}):
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 font-mono text-[10px] bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
                  {preview.parsedContacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-[#c9d1d9] py-0.5 border-b border-[#21262d] last:border-0">
                      <span className="font-medium text-white">{c.name}</span>
                      <span className="text-[#8b949e] truncate max-w-[240px]">
                        {c.title} • <span className="text-[#f0883e]">{c.companyName}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-between">
          <div>
            {currentStep !== 'upload' && (
              <button
                type="button"
                onClick={() =>
                  setCurrentStep(currentStep === 'preview' ? 'mapping' : 'upload')
                }
                className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-white rounded-lg transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-white rounded-lg transition-colors"
            >
              Cancel
            </button>

            {currentStep === 'mapping' && (
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-4 py-2 bg-[#f0883e] hover:bg-[#d97706] text-black font-semibold rounded-lg text-xs shadow-md transition-colors flex items-center gap-1.5"
              >
                Preview Analysis
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {currentStep === 'preview' && (
              <button
                type="button"
                onClick={handleConfirmMerge}
                disabled={!preview || preview.validContacts === 0}
                className="px-4 py-2 bg-[#f0883e] hover:bg-[#d97706] text-black font-semibold rounded-lg text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Confirm & Merge into Graph
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
