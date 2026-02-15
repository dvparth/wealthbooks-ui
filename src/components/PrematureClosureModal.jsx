import { useState, useMemo, useRef } from 'react';
import { validatePrematureClosure, calculatePrematureClosurePayout } from '../utils/prematureClosureCalculator.js';
import '../styles/PrematureClosureModal.css';

/**
 * Modal for initiating premature closure of an investment
 */
export default function PrematureClosureModal({
  investment,
  onSubmit,
  onCancel,
}) {
  const [closureDate, setClosureDate] = useState('');
  const [penaltyOption, setPenaltyOption] = useState('none'); // 'none', 'rate', 'amount'
  const [penaltyRate, setPenaltyRate] = useState('');
  const [penaltyAmount, setPenaltyAmount] = useState('');
  const [maturityOverride, setMaturityOverride] = useState(''); // User-specified payout amount
  const [errors, setErrors] = useState({});
  const modalBodyRef = useRef(null);

  // Calculate payout preview as user types
  const payoutPreview = useMemo(() => {
    if (!closureDate) return null;

    // If user specified override amount, use that directly
    if (maturityOverride && parseFloat(maturityOverride) > 0) {
      return {
        finalPayout: parseFloat(maturityOverride),
        recalculatedInterest: parseFloat(maturityOverride) - investment.principal,
        penalties: 0,
        effectiveRate: investment.interestRate,
        explanation: 'User-specified maturity amount',
      };
    }

    const rate = penaltyOption === 'rate' ? parseFloat(penaltyRate) || 0 : 0;
    const amount = penaltyOption === 'amount' ? parseFloat(penaltyAmount) || 0 : 0;

    return calculatePrematureClosurePayout(investment, closureDate, rate, amount);
  }, [investment, closureDate, penaltyOption, penaltyRate, penaltyAmount, maturityOverride]);

  // Calculate days held info
  const daysInfo = useMemo(() => {
    if (!closureDate || !investment.startDate || !investment.maturityDate) return null;

    const parseDate = (dateStr) => {
      const parts = dateStr.split('-');
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };

    const start = parseDate(investment.startDate);
    const closure = parseDate(closureDate);
    const maturity = parseDate(investment.maturityDate);

    if (closure <= start) return null;

    const daysHeld = Math.floor((closure - start) / (24 * 60 * 60 * 1000));
    const daysToMaturity = Math.floor((maturity - start) / (24 * 60 * 60 * 1000));
    const percentageHeld = (daysHeld / daysToMaturity * 100).toFixed(1);

    return {
      daysHeld,
      daysToMaturity,
      percentageHeld,
    };
  }, [investment, closureDate]);

  const validateForm = () => {
    const newErrors = {};

    if (!closureDate) {
      newErrors.closureDate = 'Closure date is required';
    }

    // If maturity override is specified, validate it directly
    if (maturityOverride && maturityOverride !== '') {
      if (isNaN(maturityOverride)) {
        newErrors.maturityOverride = 'Must be a valid number';
      } else if (parseFloat(maturityOverride) < investment.principal) {
        newErrors.maturityOverride = `Cannot be less than principal (₹${investment.principal.toLocaleString('en-IN')})`;
      } else if (parseFloat(maturityOverride) <= 0) {
        newErrors.maturityOverride = 'Must be a positive amount';
      }
    } else {
      // Only validate penalty if not using maturity override
      if (penaltyOption === 'rate') {
        if (!penaltyRate || penaltyRate === '') {
          newErrors.penaltyRate = 'Penalty rate is required';
        } else if (isNaN(penaltyRate)) {
          newErrors.penaltyRate = 'Must be a valid number';
        } else if (parseFloat(penaltyRate) < 0) {
          newErrors.penaltyRate = 'Cannot be negative';
        } else if (parseFloat(penaltyRate) > 100) {
          newErrors.penaltyRate = 'Cannot exceed 100%';
        }
      }

      if (penaltyOption === 'amount') {
        if (!penaltyAmount || penaltyAmount === '') {
          newErrors.penaltyAmount = 'Penalty amount is required';
        } else if (isNaN(penaltyAmount)) {
          newErrors.penaltyAmount = 'Must be a valid number';
        } else if (parseFloat(penaltyAmount) < 0) {
          newErrors.penaltyAmount = 'Cannot be negative';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const rate = penaltyOption === 'rate' ? parseFloat(penaltyRate) : 0;
    const amount = penaltyOption === 'amount' ? parseFloat(penaltyAmount) : 0;

    const prematureClosure = {
      isClosed: true,
      closureDate: closureDate,
      penaltyRate: rate || undefined,
      penaltyAmount: amount || undefined,
      recalculatedInterest: payoutPreview?.recalculatedInterest || 0,
      finalPayout: payoutPreview?.finalPayout || investment.principal,
      maturityOverride: maturityOverride && parseFloat(maturityOverride) > 0 ? parseFloat(maturityOverride) : undefined,
    };

    onSubmit(prematureClosure);
  };

  const handleCancel = () => {
    setClosureDate('');
    setPenaltyOption('none');
    setPenaltyRate('');
    setPenaltyAmount('');
    setMaturityOverride('');
    setErrors({});
    onCancel();
  };

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="closure-modal-overlay">
      <div className="closure-modal modal-container">
        <div className="modal-header">
          <h3>Premature Closure</h3>
          <button
            className="modal-close-btn"
            onClick={handleCancel}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="modal-body" ref={modalBodyRef}>
          <div className="info-card">
            <div className="info-row">
              <span className="info-label">Investment:</span>
              <span className="info-value">{investment.name || investment.externalInvestmentId}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Principal:</span>
              <span className="info-value">{formatCurrency(investment.principal)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Start Date:</span>
              <span className="info-value">{investment.startDate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Original Maturity:</span>
              <span className="info-value">{investment.maturityDate}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Interest Rate:</span>
              <span className="info-value">{investment.interestRate}%</span>
            </div>
          </div>

          <form id="closureForm" onSubmit={handleSubmit} className="closure-form">
            {/* Closure Date */}
            <div className="form-field section">
              <label htmlFor="closureDate" className="section-title">
                Closure Date <span className="required-indicator">*</span>
              </label>
              <input
                id="closureDate"
                type="date"
                value={closureDate}
                onChange={(e) => {
                  setClosureDate(e.target.value);
                  if (errors.closureDate) {
                    setErrors({ ...errors, closureDate: undefined });
                  }
                }}
                onFocus={() => {
                  // allow the native picker to escape clipping while open
                  try { modalBodyRef.current && modalBodyRef.current.classList.add('date-focus'); } catch {}
                }}
                onBlur={() => {
                  try { modalBodyRef.current && modalBodyRef.current.classList.remove('date-focus'); } catch {}
                }}
                max={investment.maturityDate}
                className={errors.closureDate ? 'input-error' : ''}
                aria-label="Closure Date"
              />
              {errors.closureDate && (
                <span className="error-message">{errors.closureDate}</span>
              )}
            </div>

            {/* Days Info */}
            {daysInfo && (
              <div className="info-box days-info">
                <div className="info-row">
                  <span>Days held:</span>
                  <strong>{daysInfo.daysHeld} of {daysInfo.daysToMaturity} days ({daysInfo.percentageHeld}%)</strong>
                </div>
              </div>
            )}

            {/* Payout Calculation Method */}
            <div className="form-group section">
              <label className="section-title">Payout Calculation Method</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    value="calculated"
                    checked={!maturityOverride}
                    onChange={() => {
                      setMaturityOverride('');
                      setClosureDate('');
                      setErrors({ ...errors, maturityOverride: undefined });
                    }}
                  />
                  <span className="radio-label">Calculate based on interest & penalties</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    value="override"
                    checked={!!maturityOverride}
                    onChange={() => {
                      setMaturityOverride(investment.principal.toString());
                      setPenaltyOption('none');
                      setErrors({ ...errors, penaltyRate: undefined, penaltyAmount: undefined });
                    }}
                  />
                  <span className="radio-label">Specify exact payout amount</span>
                </label>
              </div>
            </div>

            {/* Maturity Override Input */}
            {maturityOverride !== '' && (
              <div className="form-group section">
                <label htmlFor="maturityOverride" className="section-title">
                  Payout Amount (₹) <span className="required-indicator">*</span>
                </label>
                <input
                  id="maturityOverride"
                  type="number"
                  step="0.01"
                  placeholder={`Minimum: ₹${investment.principal.toLocaleString('en-IN')}`}
                  value={maturityOverride}
                  onChange={(e) => {
                    setMaturityOverride(e.target.value);
                    if (errors.maturityOverride) {
                      setErrors({ ...errors, maturityOverride: undefined });
                    }
                  }}
                  className={errors.maturityOverride ? 'input-error' : ''}
                />
                {errors.maturityOverride && (
                  <span className="error-message">{errors.maturityOverride}</span>
                )}
              </div>
            )}

            {/* Penalty Selection (only show if not using override) */}
            {maturityOverride === '' && (
              <>
                <div className="form-group section">
                  <label className="section-title">Penalty Type</label>
                  <div className="radio-group">
                    <label className="radio-option">
                      <input
                        type="radio"
                        value="none"
                        checked={penaltyOption === 'none'}
                        onChange={(e) => {
                          setPenaltyOption(e.target.value);
                          setErrors({ ...errors, penaltyRate: undefined, penaltyAmount: undefined });
                        }}
                      />
                      <span className="radio-label">No penalty</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        value="rate"
                        checked={penaltyOption === 'rate'}
                        onChange={(e) => {
                          setPenaltyOption(e.target.value);
                          setErrors({ ...errors, penaltyRate: undefined });
                        }}
                      />
                      <span className="radio-label">Reduce interest rate by %</span>
                    </label>
                    <label className="radio-option">
                      <input
                        type="radio"
                        value="amount"
                        checked={penaltyOption === 'amount'}
                        onChange={(e) => {
                          setPenaltyOption(e.target.value);
                          setErrors({ ...errors, penaltyAmount: undefined });
                        }}
                      />
                      <span className="radio-label">Fixed penalty amount</span>
                    </label>
                  </div>
                </div>

                {/* Penalty Rate Input */}
                {penaltyOption === 'rate' && (
                  <div className="form-group">
                    <label htmlFor="penaltyRate">
                      Penalty Rate (%) <span className="required-indicator">*</span>
                    </label>
                    <input
                      id="penaltyRate"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 1.5"
                      value={penaltyRate}
                      onChange={(e) => {
                        setPenaltyRate(e.target.value);
                        if (errors.penaltyRate) {
                          setErrors({ ...errors, penaltyRate: undefined });
                        }
                      }}
                      className={errors.penaltyRate ? 'input-error' : ''}
                    />
                    {errors.penaltyRate && (
                      <span className="error-message">{errors.penaltyRate}</span>
                    )}
                  </div>
                )}

                {/* Penalty Amount Input */}
                {penaltyOption === 'amount' && (
                  <div className="form-group">
                    <label htmlFor="penaltyAmount">
                      Penalty Amount (₹) <span className="required-indicator">*</span>
                    </label>
                    <input
                      id="penaltyAmount"
                      type="number"
                      step="0.01"
                      placeholder="e.g., 5000"
                      value={penaltyAmount}
                      onChange={(e) => {
                        setPenaltyAmount(e.target.value);
                        if (errors.penaltyAmount) {
                          setErrors({ ...errors, penaltyAmount: undefined });
                        }
                      }}
                      className={errors.penaltyAmount ? 'input-error' : ''}
                    />
                    {errors.penaltyAmount && (
                      <span className="error-message">{errors.penaltyAmount}</span>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Payout Preview */}
            {payoutPreview && (
              <div className="info-box payout-preview">
                <strong>Payout Preview</strong>
                <div className="info-row">
                  <span>Recalculated Interest:</span>
                  <span>{formatCurrency(payoutPreview.recalculatedInterest)}</span>
                </div>
                {payoutPreview.penalties > 0 && (
                  <div className="info-row penalty">
                    <span>Penalty Deduction:</span>
                    <span>−{formatCurrency(payoutPreview.penalties)}</span>
                  </div>
                )}
                <div className="info-row total">
                  <strong>Final Payout:</strong>
                  <strong>{formatCurrency(payoutPreview.finalPayout)}</strong>
                </div>
              </div>
            )}

            {errors.general && (
              <div className="error-message-general">{errors.general}</div>
            )}
            {errors.penalty && (
              <div className="error-message-general">{errors.penalty}</div>
            )}

            {/* Actions are placed in modal footer to keep footer sticky */}
          </form>
        </div>

        <div className="modal-footer">
          <button type="submit" form="closureForm" className="btn-primary confirm-btn">
            Confirm Closure
          </button>
          <button type="button" className="btn-secondary cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
