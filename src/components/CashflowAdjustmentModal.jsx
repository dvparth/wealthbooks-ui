import { useState } from 'react';
import '../styles/CashflowAdjustmentModal.css';

/**
 * Modal for adjusting system-generated cashflows
 * Allows user to create a manual adjustment entry without modifying the original
 */
export default function CashflowAdjustmentModal({ 
  cashflow, 
  onSubmit, 
  onCancel 
}) {
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!adjustmentAmount || adjustmentAmount === '') {
      newErrors.adjustmentAmount = 'Adjustment amount is required';
    } else if (isNaN(adjustmentAmount)) {
      newErrors.adjustmentAmount = 'Must be a valid number';
    }
    
    if (!reason || reason.trim() === '') {
      newErrors.reason = 'Reason is mandatory';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Determine linkedTo based on cashflow type being adjusted
    const getLinkedToByType = (type) => {
      if (type === 'tds_deduction' || type === 'tds') return 'TDS';
      if (type === 'interest' || type === 'compounded_interest') return 'INTEREST';
      if (type === 'maturity_payout' || type === 'maturity') return 'MATURITY';
      if (type === 'penalty') return 'PENALTY';
      if (type === 'premature_closure') return 'PREMATURE_CLOSURE';
      return 'MATURITY'; // Default fallback
    };

    const adjustment = {
      type: 'adjustment',
      linkedTo: getLinkedToByType(cashflow.type),
      amount: parseFloat(adjustmentAmount),
      date: cashflow.date,
      source: 'manual',
      reason: reason.trim(),
      adjustsCashflowId: cashflow.id,
      investmentId: cashflow.investmentId,
      financialYear: cashflow.financialYear,
      status: 'confirmed',
    };

    onSubmit(adjustment);
  };

  const handleCancel = () => {
    setAdjustmentAmount('');
    setReason('');
    setErrors({});
    onCancel();
  };

  return (
    <div className="adjustment-modal-overlay">
      <div className="adjustment-modal">
        <div className="modal-header">
          <h3>Adjust Cashflow</h3>
          <button 
            className="modal-close-btn" 
            onClick={handleCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-content">
          <div className="cashflow-info">
            <div className="info-row">
              <span className="info-label">Original Entry:</span>
              <span className="info-value">
                {cashflow.type.replace(/_/g, ' ')} - ₹{Math.abs(cashflow.amount).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">Date:</span>
              <span className="info-value">
                {new Date(cashflow.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="adjustment-form">
            <div className="form-group">
              <label htmlFor="adjustmentAmount">
                Adjustment Amount (₹)
                <span className="required-indicator">*</span>
              </label>
              <input
                id="adjustmentAmount"
                type="number"
                step="0.01"
                placeholder="e.g., 500 or -250"
                value={adjustmentAmount}
                onChange={(e) => {
                  setAdjustmentAmount(e.target.value);
                  if (errors.adjustmentAmount) {
                    setErrors({ ...errors, adjustmentAmount: undefined });
                  }
                }}
                className={errors.adjustmentAmount ? 'input-error' : ''}
              />
              {errors.adjustmentAmount && (
                <span className="error-message">{errors.adjustmentAmount}</span>
              )}
              <small className="help-text">
                Positive value = credit, Negative value = debit
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="reason">
                Reason for Adjustment
                <span className="required-indicator">*</span>
              </label>
              <textarea
                id="reason"
                placeholder="e.g., 'Bank credited lower interest due to rate change' or 'Actual maturity amount from statement'"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (errors.reason) {
                    setErrors({ ...errors, reason: undefined });
                  }
                }}
                rows="4"
                className={errors.reason ? 'input-error' : ''}
              />
              {errors.reason && (
                <span className="error-message">{errors.reason}</span>
              )}
              <small className="help-text">
                Mandatory field for audit trail
              </small>
            </div>

            <div className="form-group info-box">
              <strong>Note:</strong> The original system entry will remain unchanged. 
              This creates a linked manual adjustment entry for reconciliation.
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
              >
                Create Adjustment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
