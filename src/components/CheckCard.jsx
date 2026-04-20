import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { clsx } from 'clsx';

const CheckCard = ({ check }) => {
  // check: { check_name, status, confidence, message, guidance, rag_rule }
  
  const isPass = check.status === 'PASS';
  const isWarning = check.status === 'WARNING';
  const isFail = check.status === 'FAIL';

  return (
    <div className={clsx(
      "p-5 rounded-xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md",
      {
        "border-green-200 hover:border-green-300": isPass,
        "border-amber-200 hover:border-amber-300": isWarning,
        "border-rose-200 hover:border-rose-300": isFail,
      }
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {isPass && <CheckCircle2 className="w-6 h-6 text-green-500" />}
          {isWarning && <AlertTriangle className="w-6 h-6 text-amber-500" />}
          {isFail && <XCircle className="w-6 h-6 text-rose-500" />}
          
          <div>
            <h3 className="font-semibold text-gray-900">{check.check_name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={clsx(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                {
                  "bg-green-100 text-green-700": isPass,
                  "bg-amber-100 text-amber-700": isWarning,
                  "bg-rose-100 text-rose-700": isFail,
                }
              )}>
                {check.status}
              </span>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {Math.round(check.confidence * 100)}% Confidence
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-700">
        <p>{check.message}</p>
      </div>

      {(check.guidance || check.rag_rule) && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          {check.guidance && (
            <div className="flex items-start gap-2 text-sm text-gray-600 bg-blue-50/50 p-2 rounded-lg">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p><span className="font-medium text-gray-700">Guidance:</span> {check.guidance}</p>
            </div>
          )}
          {check.rag_rule && (
            <div className="text-xs text-gray-400 font-mono bg-gray-50 p-2 rounded border border-gray-100 line-clamp-1 hover:line-clamp-none transition-all">
              Rule: {check.rag_rule}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CheckCard;
