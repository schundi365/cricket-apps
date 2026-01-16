import React from 'react';
import './RiskWarningBanner.css';

function RiskWarningBanner({ calculation, parameters }) {
  // Determine if there are any risk warnings
  const getRiskIssues = () => {
    const issues = [];

    if (!calculation || !parameters) {
      return issues;
    }

    // Check if risk exceeds 3%
    if (calculation.lotSize && calculation.lotSize.riskPercentage > 3) {
      issues.push({
        type: 'RISK_EXCEEDED',
        severity: 'critical',
        message: `Risk percentage (${calculation.lotSize.riskPercentage.toFixed(2)}%) exceeds the 3% maximum limit`,
        suggestion: 'Reduce lot size, increase trading capital, or decrease stop loss distance'
      });
    }

    // Check if lot size is zero (trade not possible)
    if (calculation.lotSize && calculation.lotSize.lotSize === 0) {
      issues.push({
        type: 'LOT_SIZE_ZERO',
        severity: 'critical',
        message: 'Calculated lot size is zero - trade cannot be executed',
        suggestion: 'Increase trading capital or reduce stop loss distance'
      });
    }

    // Check for lot size warnings
    if (calculation.lotSize && calculation.lotSize.warnings && calculation.lotSize.warnings.length > 0) {
      calculation.lotSize.warnings.forEach(warning => {
        issues.push({
          type: 'LOT_SIZE_WARNING',
          severity: 'warning',
          message: warning,
          suggestion: 'Review your trading parameters'
        });
      });
    }

    // Check if stop loss is invalid
    if (calculation.stopLoss && !calculation.stopLoss.valid) {
      issues.push({
        type: 'INVALID_STOP_LOSS',
        severity: 'critical',
        message: 'Stop loss placement is invalid for the selected trade direction',
        suggestion: 'Verify your entry price and stop loss distance'
      });
    }

    // Check if stop loss distance is too large
    if (parameters.stopLossDistance && parameters.entryPrice) {
      const distanceRatio = parameters.stopLossDistance / parameters.entryPrice;
      if (distanceRatio > 0.1) { // More than 10% of entry price
        issues.push({
          type: 'STOP_LOSS_TOO_FAR',
          severity: 'warning',
          message: 'Stop loss distance is very large relative to entry price',
          suggestion: 'Consider reducing stop loss distance for better risk management'
        });
      }
    }

    // Check if max loss is too high relative to capital
    if (calculation.stopLoss && parameters.tradingCapital) {
      const maxLossRatio = calculation.stopLoss.maxLoss / parameters.tradingCapital;
      if (maxLossRatio > 0.05) { // More than 5% of capital
        issues.push({
          type: 'MAX_LOSS_HIGH',
          severity: 'warning',
          message: `Maximum loss (${(maxLossRatio * 100).toFixed(2)}%) is higher than recommended`,
          suggestion: 'Consider adjusting parameters to reduce potential loss'
        });
      }
    }

    return issues;
  };

  const issues = getRiskIssues();

  // Don't render if no issues
  if (issues.length === 0) {
    return null;
  }

  // Check if any critical issues exist
  const hasCriticalIssues = issues.some(issue => issue.severity === 'critical');

  return (
    <div className={`risk-warning-banner ${hasCriticalIssues ? 'critical' : 'warning'}`}>
      <div className="banner-header">
        <span className="banner-icon">
          {hasCriticalIssues ? '🚫' : '⚠️'}
        </span>
        <h4 className="banner-title">
          {hasCriticalIssues ? 'Trade Cannot Be Executed' : 'Risk Warnings'}
        </h4>
      </div>

      <div className="banner-content">
        {issues.map((issue, index) => (
          <div key={index} className={`issue-item ${issue.severity}`}>
            <div className="issue-message">
              <span className="issue-icon">
                {issue.severity === 'critical' ? '❌' : '⚠️'}
              </span>
              <span className="issue-text">{issue.message}</span>
            </div>
            <div className="issue-suggestion">
              💡 {issue.suggestion}
            </div>
          </div>
        ))}
      </div>

      {hasCriticalIssues && (
        <div className="banner-footer">
          <p className="footer-text">
            Please correct the issues above before proceeding with this trade.
          </p>
        </div>
      )}
    </div>
  );
}

export default RiskWarningBanner;
