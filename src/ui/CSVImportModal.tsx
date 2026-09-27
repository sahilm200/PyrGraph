import React, { useState } from 'react';
import { GraphSnapshot, TeamMember } from '../../shared/contracts';
import { normalizeConnections, ImportPreview } from '../core/import/csv';
import { X, Upload, FileText, CheckCircle2, AlertCircle, Sparkles, UserPlus } from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  members: TeamMember[];
  currentSnapshot: GraphSnapshot;
  onImportComplete: (updatedSnapshot: GraphSnapshot) => void;
  onClose: () => void;
}

const SAMPLE_CSV_DATA = `First Name,Last Name,URL,Email Address,Company,Position,Connected On
David,Kim,https://www.linkedin.com/in/davidkim-example,david.k@example.com,Ramp,VP Revenue Operations,14 Aug 2024
Rachel,Green,https://www.linkedin.com/in/rachelgreen-example,rachel@example.com,Brex,Head of Global Sales Strategy,02 Jan 2025
Liam,O'Connor,https://www.linkedin.com/in/liamoconnor-example,,Ramp,Senior Infrastructure Architect,10 May 2023
Elena,Rostova,https://www.linkedin.com/in/elenarostova-example,,Stripe,Head of Global Revenue Operations,15 Mar 2024
`;

export const CSVImportModal: React.FC<CSVImportModalProps> = ({
  isOpen,
  members,
  currentSnapshot,
  onImportComplete,
  onClose,
}) => {
  const [selectedOwner, setSelectedOwner] = useState<string>(members[0]?.id || 'sahil');
  const [csvContent, setCsvContent] = useState<string>('');
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProcessCSV = (rawText: string) => {
    setError(null);
    try {
      const result = normalizeConnections(rawText, selectedOwner, currentSnapshot);
      setPreview(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error parsing CSV file');
      setPreview(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      handleProcessCSV(text);
    };
    reader.readAsText(file);
  };

  const handleLoadSample = () => {
    setCsvContent(SAMPLE_CSV_DATA);
    handleProcessCSV(SAMPLE_CSV_DATA);
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
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-[#30363d] bg-[#0d1117] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-[#f0883e]" />
            <h3 className="text-sm font-bold text-white">Import LinkedIn Connections CSV</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b949e] hover:text-white p-1 rounded-md hover:bg-[#21262d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-[#8b949e]">
            Upload an official LinkedIn Connection archive (CSV). Connections will be normalized into
            first-degree edges for the selected team member.
          </p>

          {/* Owner selector */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-white">
              Assign Connection Owner:
            </label>
            <div className="flex items-center gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedOwner(m.id);
                    if (csvContent) {
                      try {
                        const result = normalizeConnections(csvContent, m.id, currentSnapshot);
                        setPreview(result);
                      } catch {}
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-all ${
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

          {/* File Upload & Sample Button */}
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

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Preview statistics */}
          {preview && (
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Import Analysis Preview</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg">
                  <div className="text-base font-bold text-white">{preview.validContacts}</div>
                  <div className="text-[10px] text-[#8b949e]">New Contacts</div>
                </div>
                <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg">
                  <div className="text-base font-bold text-[#f0883e]">{preview.newAccountsDetected}</div>
                  <div className="text-[10px] text-[#8b949e]">New Accounts</div>
                </div>
                <div className="p-2 bg-[#161b22] border border-[#30363d] rounded-lg">
                  <div className="text-base font-bold text-[#8b949e]">{preview.duplicateCount}</div>
                  <div className="text-[10px] text-[#8b949e]">Duplicates Deduplicated</div>
                </div>
              </div>

              <div className="text-[11px] text-[#8b949e] space-y-1">
                <span className="font-semibold text-white">Contacts identified:</span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[10px]">
                  {preview.parsedContacts.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-[#c9d1d9]">
                      <span>{c.name}</span>
                      <span className="text-[#8b949e]">{c.title} • {c.companyName}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#30363d] bg-[#0d1117] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-[#8b949e] hover:text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirmMerge}
            disabled={!preview || preview.validContacts === 0}
            className="px-4 py-2 bg-[#f0883e] hover:bg-[#d97706] text-black font-semibold rounded-lg text-xs shadow-md transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Merge into Session Graph
          </button>
        </div>
      </div>
    </div>
  );
};
