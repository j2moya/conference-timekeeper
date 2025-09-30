import React from 'react';
import type { ConferencePlan } from '../types';
import { PrintIcon } from './icons';

interface PrintViewProps {
  plan: ConferencePlan;
  onBack: () => void;
}

const PrintView: React.FC<PrintViewProps> = ({ plan, onBack }) => {

  const handlePrint = () => {
    const printableArea = document.getElementById('printable-area');
    if (!printableArea) {
      console.error("Could not find element with id 'printable-area'");
      alert("An error occurred: Printable content not found.");
      return;
    }

    const contentHTML = printableArea.outerHTML;

    // Open a new window for printing
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Please disable your pop-up blocker to print the summary.');
      return;
    }

    // Write the content to the new window
    printWindow.document.open();
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <title>Print - ${plan.title}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            /* Ensure backgrounds and colors are printed */
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          </style>
        </head>
        <body>
          ${contentHTML}
          <script type="text/javascript">
            // Use a timeout to allow TailwindCSS to process the classes before printing
            setTimeout(() => {
              window.focus(); // Focus is needed for some browsers
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };
  
  const segmentDuration = plan.segments.length > 0 ? (plan.totalDurationMinutes / plan.segments.length).toFixed(2) : '0.00';

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700 print-container">
        <div className="flex justify-between items-center mb-6 no-print">
            <h2 className="text-2xl font-bold text-indigo-300">Printable Summary</h2>
            <div className="flex gap-4">
                <button onClick={onBack} className="px-4 py-2 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-colors">
                    Back to Player
                </button>
                <button onClick={handlePrint} className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg shadow-lg hover:scale-105 transform transition-all duration-300 flex items-center gap-2">
                    <PrintIcon /> Print / Save as PDF
                </button>
            </div>
        </div>

        <div id="printable-area" className="bg-white text-gray-800 p-8 rounded-lg shadow-inner">
            <header className="border-b-2 border-gray-300 pb-4 mb-6">
                <h1 className="text-4xl font-bold text-center text-gray-900">{plan.title}</h1>
                <p className="text-center text-gray-600 mt-2">
                    Total Duration: <strong>{plan.totalDurationMinutes} minutes</strong> | 
                    Segments: <strong>{plan.segments.length}</strong> | 
                    Time per Segment: approx. <strong>{segmentDuration} minutes</strong>
                </p>
            </header>
            
            <main>
                <div className="space-y-6">
                    {plan.segments.map((segment, index) => (
                        <div key={segment.id} className="p-4 border border-gray-200 rounded-md bg-gray-50 break-inside-avoid">
                            <h3 className="text-xl font-semibold text-indigo-700">Segment {index + 1}: {segment.title}</h3>
                            {segment.subtitle && <p className="text-md text-gray-700 mt-1 italic">"{segment.subtitle}"</p>}
                            <div className="mt-3 text-sm text-gray-600 space-y-1">
                                {segment.mediaUrl && <p><strong>Media:</strong> <span className="break-all font-mono text-xs">{segment.mediaUrl}</span></p>}
                                {segment.relatedLink && <p><strong>Link:</strong> <span className="break-all font-mono text-xs">{segment.relatedLink}</span></p>}
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="mt-8 pt-4 text-center text-xs text-gray-500 border-t border-gray-200">
                <p>Powered by <strong>Conference Timekeeper</strong></p>
            </footer>
        </div>
    </div>
  );
};

export default PrintView;
