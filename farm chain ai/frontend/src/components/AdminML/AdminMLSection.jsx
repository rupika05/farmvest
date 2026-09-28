import React, { useState, useEffect } from 'react';
import {
  getMlHealth,
  getMlDatasets,
  uploadMlDataset,
  getMlDatasetPreview,
  approveMlDataset,
  rejectMlDataset,
  deleteMlDataset,
  trainMlModel,
  getMlTrainingStatus,
  getMlModels,
  activateMlModel,
  getMlPriceRecommendation,
  getMlFairnessAnalytics
} from '../../services/api';
import './AdminMLSection.css';

export default function AdminMLSection() {
  const [activeSubTab, setActiveSubTab] = useState('datasets'); // 'datasets' | 'training' | 'models' | 'sandbox' | 'analytics'
  const [health, setHealth] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(null);
  const [datasetPreview, setDatasetPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null);

  // Training State
  const [trainDatasetId, setTrainDatasetId] = useState('');
  const [trainAlgorithm, setTrainAlgorithm] = useState('auto');
  const [trainingStatus, setTrainingStatus] = useState({ is_training: false, current_step: 'Idle', progress_percentage: 0 });
  const [trainInterval, setTrainInterval] = useState(null);

  // Model Versions
  const [modelsData, setModelsData] = useState({ active_version: null, models: [] });
  const [selectedModelVersion, setSelectedModelVersion] = useState(null);

  // Prediction Sandbox State
  const [sandboxInput, setSandboxInput] = useState({
    crop: 'Tomato',
    mandi_price: 35.0,
    quality_grade: 'Grade A',
    quantity_kg: 500,
    demand_level: 'High',
    supply_level: 'Medium'
  });
  const [sandboxResult, setSandboxResult] = useState(null);
  const [testingPrediction, setTestingPrediction] = useState(false);

  // Fairness Analytics
  const [analyticsData, setAnalyticsData] = useState(null);

  // Initial Load
  useEffect(() => {
    loadAllData();
  }, []);

  async function loadAllData() {
    const [h, ds, mods, an] = await Promise.all([
      getMlHealth(),
      getMlDatasets(),
      getMlModels(),
      getMlFairnessAnalytics()
    ]);
    setHealth(h);
    setDatasets(ds);
    setModelsData(mods);
    setAnalyticsData(an);

    if (ds.length > 0) {
      if (!selectedDatasetId) {
        handleSelectDataset(ds[0].id);
      }
      // Prefer first approved dataset, else fallback to first available
      const firstApproved = ds.find(d => d.status === 'APPROVED');
      setTrainDatasetId(prev => prev || (firstApproved ? firstApproved.id : ds[0].id));
    }
    if (mods.models?.length > 0 && !selectedModelVersion) {
      setSelectedModelVersion(mods.models[0]);
    }

    // Check ongoing training status
    const curStatus = await getMlTrainingStatus();
    if (curStatus?.is_training) {
      setTrainingStatus(curStatus);
    }
  }

  async function handleSelectDataset(id) {
    setSelectedDatasetId(id);
    setLoadingPreview(true);
    const prev = await getMlDatasetPreview(id);
    setDatasetPreview(prev);
    setLoadingPreview(false);
  }

  // Upload Handler
  async function handleUpload(e) {
    e.preventDefault();
    if (!uploadFile) {
      alert('Please select a CSV file to upload.');
      return;
    }
    setUploading(true);
    setUploadFeedback(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('name', uploadName || uploadFile.name);
    formData.append('description', uploadDesc);

    const res = await uploadMlDataset(formData);
    setUploading(false);

    if (res.ok) {
      setUploadFeedback({
        type: 'success',
        msg: `Dataset "${res.data.dataset.name}" uploaded successfully (${res.data.dataset.total_rows} rows).`,
        validation: res.data.validation
      });
      setUploadFile(null);
      setUploadName('');
      setUploadDesc('');
      loadAllData();
      handleSelectDataset(res.data.dataset.id);
    } else {
      setUploadFeedback({
        type: 'error',
        msg: res.data?.error || res.error || 'Failed to upload dataset.'
      });
    }
  }

  // Approve / Reject / Delete
  async function handleApprove(id) {
    await approveMlDataset(id);
    loadAllData();
    handleSelectDataset(id);
  }

  async function handleReject(id) {
    await rejectMlDataset(id);
    loadAllData();
    handleSelectDataset(id);
  }

  async function handleDelete(id) {
    if (window.confirm('Are you sure you want to permanently delete this dataset?')) {
      await deleteMlDataset(id);
      loadAllData();
      setDatasetPreview(null);
    }
  }

  // Train Trigger & Poller
  async function handleStartTraining() {
    if (!trainDatasetId) {
      alert('Please select a dataset for training.');
      return;
    }

    const currentDs = datasets.find(d => d.id === trainDatasetId);
    if (!currentDs) {
      alert('Selected dataset not found. Please refresh or select a valid dataset.');
      return;
    }

    // Auto-approve dataset if not already approved
    if (currentDs.status !== 'APPROVED') {
      try {
        setTrainingStatus({
          is_training: true,
          current_step: `Approving dataset "${currentDs.name}" for training...`,
          progress_percentage: 5,
          latest_version: null,
          error: null
        });
        const appr = await approveMlDataset(currentDs.id);
        if (!appr) {
          throw new Error(`Failed to approve dataset "${currentDs.name}".`);
        }
        await loadAllData();
      } catch (err) {
        setTrainingStatus({
          is_training: false,
          current_step: 'Failed to approve dataset',
          progress_percentage: 0,
          error: err.message || 'Dataset approval failed.'
        });
        return;
      }
    }

    setTrainingStatus({
      is_training: true,
      current_step: 'Preparing dataset & initializing training pipeline...',
      progress_percentage: 10,
      latest_version: null,
      error: null
    });

    try {
      const res = await trainMlModel(trainDatasetId, trainAlgorithm);
      if (res?.error) {
        setTrainingStatus({
          is_training: false,
          current_step: 'Failed',
          progress_percentage: 0,
          error: typeof res.error === 'string' ? res.error : JSON.stringify(res.error)
        });
        return;
      }

      // Clear any previous interval
      if (trainInterval) clearInterval(trainInterval);

      // Poll status every 1 second
      const interval = setInterval(async () => {
        try {
          const st = await getMlTrainingStatus();
          setTrainingStatus(st);
          if (!st.is_training) {
            clearInterval(interval);
            setTrainInterval(null);
            await loadAllData();
          }
        } catch (err) {
          console.error('Polling training status error:', err);
        }
      }, 1000);
      setTrainInterval(interval);
    } catch (err) {
      setTrainingStatus({
        is_training: false,
        current_step: 'Failed',
        progress_percentage: 0,
        error: err.message || 'Network error triggering model training'
      });
    }
  }

  // Activate Model
  async function handleActivateModel(versionId) {
    const res = await activateMlModel(versionId);
    if (res) {
      loadAllData();
      alert(`Model version ${versionId} is now ACTIVE for all production price recommendations.`);
    }
  }

  // Test Sandbox Prediction
  async function handleTestSandbox() {
    setTestingPrediction(true);
    const rec = await getMlPriceRecommendation(sandboxInput);
    setSandboxResult(rec);
    setTestingPrediction(false);
  }

  return (
    <div className="admin-ml-root">
      {/* GovTech Header Banner */}
      <div className="admin-ml-header">
        <div className="admin-ml-title-area">
          <div className="admin-ml-badge">
            <span className="live-dot-green"></span>
            NATIONAL KRISHI AI INFERENCE ENGINE
          </div>
          <h2>AI Fair Price Recommendation Engine</h2>
          <p>
            Statistical machine-learning price calibration across <strong>Farmer</strong>,{' '}
            <strong>Intermediary</strong>, and <strong>Retailer</strong> transaction stages.
          </p>
        </div>

        <div className="admin-ml-status-pill">
          <div className="pill-item">
            <span className="pill-label">Gateway Status:</span>
            <span className={`pill-val ${health?.status === 'online' ? 'online' : 'offline'}`}>
              {health?.status === 'online' ? '● Online' : '○ Offline'}
            </span>
          </div>
          <div className="pill-item">
            <span className="pill-label">Active Model:</span>
            <span className="pill-val active-tag">
              {modelsData.active_version || 'Baseline APMC Reference'}
            </span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="admin-ml-subtabs">
        <button
          className={`ml-tab-btn ${activeSubTab === 'datasets' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('datasets')}
        >
          📁 Datasets & Validation ({datasets.length})
        </button>
        <button
          className={`ml-tab-btn ${activeSubTab === 'training' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('training')}
        >
          ⚡ Model Training Center
        </button>
        <button
          className={`ml-tab-btn ${activeSubTab === 'models' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('models')}
        >
          🏆 Model Versions & Metrics ({modelsData.models?.length || 0})
        </button>
        <button
          className={`ml-tab-btn ${activeSubTab === 'sandbox' ? 'active' : ''}`}
          onClick={() => {
            setActiveSubTab('sandbox');
            if (!sandboxResult) handleTestSandbox();
          }}
        >
          🧪 Prediction Sandbox
        </button>
        <button
          className={`ml-tab-btn ${activeSubTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('analytics')}
        >
          📊 Price Fairness Analytics
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUBTAB 1: DATASETS & VALIDATION                         */}
      {/* ======================================================== */}
      {activeSubTab === 'datasets' && (
        <div className="ml-tab-content">
          <div className="ml-split-layout">
            {/* Left: Datasets List & Upload Form */}
            <div className="ml-left-pane">
              <div className="ml-card">
                <h3>📤 Upload Historical Mandi Dataset (CSV)</h3>
                <form onSubmit={handleUpload} className="ml-upload-form">
                  <div className="ml-form-group">
                    <label>Dataset Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Tamil Nadu APMC Market Transactions 2026"
                      value={uploadName}
                      onChange={e => setUploadName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="ml-form-group">
                    <label>Description / Notes</label>
                    <textarea
                      placeholder="Historical transactions including Mandi base, quality grades, logistics, and multi-stage pricing..."
                      value={uploadDesc}
                      onChange={e => setUploadDesc(e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="ml-form-group">
                    <label>Select CSV File</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={e => setUploadFile(e.target.files[0])}
                      required
                    />
                  </div>
                  <button type="submit" className="ml-btn ml-btn-primary" disabled={uploading}>
                    {uploading ? 'Validating & Uploading...' : 'Upload & Validate Dataset'}
                  </button>
                </form>

                {uploadFeedback && (
                  <div className={`ml-feedback-box ${uploadFeedback.type}`}>
                    <strong>{uploadFeedback.type === 'success' ? '✅ Validation Complete' : '❌ Validation Error'}</strong>
                    <p>{uploadFeedback.msg}</p>
                    {uploadFeedback.validation?.warnings?.map((w, idx) => (
                      <div key={idx} className="ml-warn-item">⚠️ {w}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Datasets Table */}
              <div className="ml-card mt-3">
                <h3>📋 Registered Datasets</h3>
                <div className="ml-table-wrapper">
                  <table className="ml-table">
                    <thead>
                      <tr>
                        <th>Dataset</th>
                        <th>Rows</th>
                        <th>Quality</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datasets.map(ds => (
                        <tr
                          key={ds.id}
                          className={selectedDatasetId === ds.id ? 'row-selected' : ''}
                          onClick={() => handleSelectDataset(ds.id)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td>
                            <strong>{ds.name}</strong>
                            {ds.is_demo && <span className="demo-chip">DEMO DATA</span>}
                          </td>
                          <td>{ds.total_rows}</td>
                          <td>
                            <span className={`score-badge ${ds.quality_score >= 90 ? 'high' : 'medium'}`}>
                              {ds.quality_score}%
                            </span>
                          </td>
                          <td>
                            <span className={`status-pill ${ds.status.toLowerCase()}`}>
                              {ds.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="ml-btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectDataset(ds.id);
                              }}
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right: Selected Dataset Preview & Audit Report */}
            <div className="ml-right-pane">
              {loadingPreview ? (
                <div className="ml-card text-center p-4">Loading dataset preview and schema report...</div>
              ) : datasetPreview ? (
                <div className="ml-card">
                  <div className="preview-header">
                    <div>
                      <h3>{datasetPreview.dataset.name}</h3>
                      <p className="text-muted">{datasetPreview.dataset.description}</p>
                      {datasetPreview.dataset.is_demo && (
                        <div className="demo-notice-alert">
                          ⚠️ <strong>NOTICE:</strong> This is a synthetic demonstration dataset provided for testing. Production models must be trained on official approved market datasets.
                        </div>
                      )}
                    </div>
                    <div className="preview-actions">
                      {datasetPreview.dataset.status !== 'APPROVED' && (
                        <button
                          className="ml-btn ml-btn-approve"
                          onClick={() => handleApprove(datasetPreview.dataset.id)}
                        >
                          ✓ Approve for Training
                        </button>
                      )}
                      {datasetPreview.dataset.status !== 'REJECTED' && !datasetPreview.dataset.is_demo && (
                        <button
                          className="ml-btn ml-btn-reject"
                          onClick={() => handleReject(datasetPreview.dataset.id)}
                        >
                          ✕ Reject
                        </button>
                      )}
                      {!datasetPreview.dataset.is_demo && (
                        <button
                          className="ml-btn ml-btn-danger"
                          onClick={() => handleDelete(datasetPreview.dataset.id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Validation Summary Metrics */}
                  <div className="val-metrics-grid">
                    <div className="val-metric-box">
                      <span className="label">Total Records</span>
                      <span className="value">{datasetPreview.validation.total_rows}</span>
                    </div>
                    <div className="val-metric-box valid">
                      <span className="label">Valid Records</span>
                      <span className="value">{datasetPreview.validation.valid_rows}</span>
                    </div>
                    <div className="val-metric-box invalid">
                      <span className="label">Rejected Rows</span>
                      <span className="value">{datasetPreview.validation.invalid_rows}</span>
                    </div>
                    <div className="val-metric-box">
                      <span className="label">Duplicates</span>
                      <span className="value">{datasetPreview.validation.duplicate_rows}</span>
                    </div>
                    <div className="val-metric-box score">
                      <span className="label">Quality Score</span>
                      <span className="value">{datasetPreview.validation.quality_score}%</span>
                    </div>
                  </div>

                  {/* Errors / Warnings List */}
                  {datasetPreview.validation.errors?.length > 0 && (
                    <div className="val-errors-section">
                      <h4>⚠️ Row-Level Validation Rejection Report</h4>
                      <div className="val-errors-table-wrap">
                        <table className="val-errors-table">
                          <thead>
                            <tr>
                              <th>Row</th>
                              <th>Field</th>
                              <th>Value</th>
                              <th>Rejection Reason</th>
                            </tr>
                          </thead>
                          <tbody>
                            {datasetPreview.validation.errors.map((err, i) => (
                              <tr key={i}>
                                <td>#{err.row_index}</td>
                                <td><code>{err.column}</code></td>
                                <td>{String(err.value)}</td>
                                <td className="text-danger">{err.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Live Sample Preview Table */}
                  <div className="preview-table-section mt-3">
                    <h4>Sample Preview (First 20 Records)</h4>
                    <div className="ml-table-wrapper preview-scroll">
                      <table className="ml-table table-condensed">
                        <thead>
                          <tr>
                            <th>Crop</th>
                            <th>Mandi Base (₹)</th>
                            <th>Grade</th>
                            <th>Qty (kg)</th>
                            <th>Farmer Price (₹)</th>
                            <th>Intermediary (₹)</th>
                            <th>Retailer (₹)</th>
                            <th>Location</th>
                          </tr>
                        </thead>
                        <tbody>
                          {datasetPreview.preview_rows?.map((row, idx) => (
                            <tr key={idx}>
                              <td><strong>{row.crop}</strong></td>
                              <td>₹{row.mandi_price}</td>
                              <td><span className="grade-badge">{row.quality_grade}</span></td>
                              <td>{row.quantity_kg}</td>
                              <td className="price-tag farmer">₹{row.farmer_to_intermediary_price}</td>
                              <td className="price-tag inter">₹{row.intermediary_to_retailer_price}</td>
                              <td className="price-tag retail">₹{row.retailer_to_consumer_price}</td>
                              <td>{row.location}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="ml-card text-center p-4">Select a dataset to view validation report.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 2: MODEL TRAINING CENTER                         */}
      {/* ======================================================== */}
      {activeSubTab === 'training' && (
        <div className="ml-tab-content">
          <div className="ml-card training-control-card">
            <h3>⚡ Model Training Center</h3>
            <p className="text-muted">
              Train three specialized regression models (Farmer → Intermediary, Intermediary → Retailer, Retailer → Consumer)
              evaluating candidate algorithms (Linear Regression, Random Forest, Gradient Boosting) with empirical quantile calibration (P10–P90).
            </p>

            <div className="train-config-grid">
              <div className="ml-form-group">
                <label>Target Dataset for Model Training</label>
                <select
                  value={trainDatasetId}
                  onChange={e => setTrainDatasetId(e.target.value)}
                  disabled={trainingStatus.is_training}
                >
                  {datasets.map(d => (
                    <option key={d.id} value={d.id} disabled={d.valid_rows === 0}>
                      {d.name} ({d.total_rows} rows) — {d.status === 'APPROVED' ? '✓ Approved' : `[${d.status}]`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ml-form-group">
                <label>Candidate Algorithm Selection</label>
                <select
                  value={trainAlgorithm}
                  onChange={e => setTrainAlgorithm(e.target.value)}
                  disabled={trainingStatus.is_training}
                >
                  <option value="auto">Auto (Compare Linear, Random Forest, Gradient Boosting — Select Best Validation RMSE)</option>
                  <option value="gradient_boosting">Gradient Boosting Regressor (Quantile Sensitive)</option>
                  <option value="random_forest">Random Forest Regressor (Ensemble Trees)</option>
                  <option value="linear_regression">Linear Regression (Regularized Ridge Baseline)</option>
                </select>
              </div>
            </div>

            {/* If selected dataset is not yet approved, display an inline approval notice */}
            {(() => {
              const selectedDs = datasets.find(d => d.id === trainDatasetId);
              if (selectedDs && selectedDs.status !== 'APPROVED') {
                return (
                  <div className="ml-feedback-box info mt-2">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span>
                        ℹ️ Selected dataset <strong>{selectedDs.name}</strong> is currently <strong>{selectedDs.status}</strong>.
                        It will be automatically approved when training begins.
                      </span>
                      <button
                        type="button"
                        className="ml-btn ml-btn-small ml-btn-approve"
                        onClick={async () => {
                          await approveMlDataset(selectedDs.id);
                          await loadAllData();
                        }}
                      >
                        ✓ Approve Dataset Now
                      </button>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <div className="train-action-area">
              <button
                className="ml-btn ml-btn-train"
                onClick={handleStartTraining}
                disabled={trainingStatus.is_training}
              >
                {trainingStatus.is_training ? (
                  <>⚡ Training Models ({trainingStatus.progress_percentage}%)...</>
                ) : (
                  <>🚀 Train New Model Package</>
                )}
              </button>
            </div>

            {/* Stepper Progress */}
            {trainingStatus.is_training && (
              <div className="training-progress-box">
                <div className="progress-header">
                  <span>Current Step: <strong>{trainingStatus.current_step}</strong></span>
                  <span>{trainingStatus.progress_percentage}%</span>
                </div>
                <div className="progress-bar-track">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${trainingStatus.progress_percentage}%` }}
                  ></div>
                </div>
                <div className="stepper-labels">
                  <span className={trainingStatus.progress_percentage >= 15 ? 'active' : ''}>1. Validation</span>
                  <span className={trainingStatus.progress_percentage >= 30 ? 'active' : ''}>2. Features</span>
                  <span className={trainingStatus.progress_percentage >= 50 ? 'active' : ''}>3. Farmer Model</span>
                  <span className={trainingStatus.progress_percentage >= 70 ? 'active' : ''}>4. Intermediary</span>
                  <span className={trainingStatus.progress_percentage >= 85 ? 'active' : ''}>5. Retailer</span>
                  <span className={trainingStatus.progress_percentage >= 95 ? 'active' : ''}>6. Quantiles</span>
                </div>
              </div>
            )}

            {/* Error Display */}
            {trainingStatus.error && !trainingStatus.is_training && (
              <div className="ml-feedback-box error mt-3">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong>❌ Training Pipeline Error</strong>
                  <button
                    className="ml-btn ml-btn-small ml-btn-secondary"
                    onClick={() => setTrainingStatus(prev => ({ ...prev, error: null }))}
                  >
                    ✕ Dismiss
                  </button>
                </div>
                <p className="mt-1" style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
                  {trainingStatus.error}
                </p>
                <div className="mt-2">
                  <button
                    className="ml-btn ml-btn-small ml-btn-primary"
                    onClick={handleStartTraining}
                  >
                    🔄 Retry Training Pipeline
                  </button>
                </div>
              </div>
            )}

            {/* Success Display */}
            {trainingStatus.latest_version && !trainingStatus.is_training && (
              <div className="ml-feedback-box success mt-3">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <strong style={{ fontSize: '1rem', color: '#34d399' }}>
                      🎉 Model Package {trainingStatus.latest_version} Trained Successfully!
                    </strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: '#a7f3d0' }}>
                      Ready for production inference across Farmer, Intermediary, and Retailer stages with empirical quantile bounds.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="ml-btn ml-btn-small ml-btn-primary"
                      onClick={() => handleActivateModel(trainingStatus.latest_version)}
                    >
                      ✓ Activate for Production
                    </button>
                    <button
                      className="ml-btn ml-btn-small ml-btn-secondary"
                      onClick={() => setActiveSubTab('models')}
                    >
                      Inspect Metrics →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 3: MODEL VERSIONS & PERFORMANCE METRICS          */}
      {/* ======================================================== */}
      {activeSubTab === 'models' && (
        <div className="ml-tab-content">
          <div className="ml-split-layout">
            {/* Version List */}
            <div className="ml-left-pane">
              <div className="ml-card">
                <h3>📦 Model Version Catalog</h3>
                <div className="version-list">
                  {modelsData.models?.map(m => (
                    <div
                      key={m.version_id}
                      className={`version-card-item ${selectedModelVersion?.version_id === m.version_id ? 'selected' : ''}`}
                      onClick={() => setSelectedModelVersion(m)}
                    >
                      <div className="version-card-top">
                        <div className="version-id-badge">
                          <strong>{m.version_id}</strong>
                          {m.version_id === modelsData.active_version && (
                            <span className="active-prod-badge">● ACTIVE IN PRODUCTION</span>
                          )}
                        </div>
                        <span className="version-date">
                          {new Date(m.trained_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="version-card-sub">
                        <span>Algo: <strong>{m.model_type}</strong></span>
                        <span>Samples: <strong>{m.total_rows || 350}</strong></span>
                        <span>Farmer R²: <strong>{m.metrics?.farmerToIntermediary?.r2}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Version Details & Metrics */}
            <div className="ml-right-pane">
              {selectedModelVersion ? (
                <div className="ml-card">
                  <div className="version-detail-header">
                    <div>
                      <h3>Model Version: {selectedModelVersion.version_id}</h3>
                      <p className="text-muted">
                        Trained from dataset: <strong>{selectedModelVersion.dataset_name}</strong> | Type: <strong>{selectedModelVersion.model_type}</strong>
                      </p>
                    </div>
                    <div>
                      {selectedModelVersion.version_id === modelsData.active_version ? (
                        <span className="live-active-tag">✓ Currently Active for Production</span>
                      ) : (
                        <button
                          className="ml-btn ml-btn-approve"
                          onClick={() => handleActivateModel(selectedModelVersion.version_id)}
                        >
                          Activate Version for Production
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Stage Metrics Grid */}
                  <h4 className="mt-3">Stage-by-Stage Performance Metrics (Test Split)</h4>
                  <div className="stage-metrics-grid">
                    {/* Farmer */}
                    <div className="stage-metric-card farmer">
                      <h5>🌾 Farmer → Intermediary</h5>
                      <div className="metric-row">
                        <span>MAE (Mean Absolute Error):</span>
                        <strong>₹{selectedModelVersion.metrics?.farmerToIntermediary?.mae}/kg</strong>
                      </div>
                      <div className="metric-row">
                        <span>RMSE:</span>
                        <strong>₹{selectedModelVersion.metrics?.farmerToIntermediary?.rmse}/kg</strong>
                      </div>
                      <div className="metric-row">
                        <span>R² Score:</span>
                        <strong className="r2-score">{selectedModelVersion.metrics?.farmerToIntermediary?.r2}</strong>
                      </div>
                      <div className="metric-row">
                        <span>MAPE:</span>
                        <strong>{selectedModelVersion.metrics?.farmerToIntermediary?.mape}%</strong>
                      </div>
                    </div>

                    {/* Intermediary */}
                    <div className="stage-metric-card inter">
                      <h5>🤝 Intermediary → Retailer</h5>
                      <div className="metric-row">
                        <span>MAE:</span>
                        <strong>₹{selectedModelVersion.metrics?.intermediaryToRetailer?.mae}/kg</strong>
                      </div>
                      <div className="metric-row">
                        <span>RMSE:</span>
                        <strong>₹{selectedModelVersion.metrics?.intermediaryToRetailer?.rmse}/kg</strong>
                      </div>
                      <div className="metric-row">
                        <span>R² Score:</span>
                        <strong className="r2-score">{selectedModelVersion.metrics?.intermediaryToRetailer?.r2}</strong>
                      </div>
                      <div className="metric-row">
                        <span>MAPE:</span>
                        <strong>{selectedModelVersion.metrics?.intermediaryToRetailer?.mape}%</strong>
                      </div>
                    </div>

                    {/* Retailer */}
                    <div className="stage-metric-card retail">
                      <h5>🏪 Retailer → Consumer</h5>
                      <div className="metric-row">
                        <span>MAE:</span>
                        <strong>₹{selectedModelVersion.metrics?.retailerToConsumer?.mae}/kg</strong>
                      </div>
                      <div className="metric-row">
                        <span>RMSE:</span>
                        <strong>₹{selectedModelVersion.metrics?.retailerToConsumer?.rmse}/kg</strong>
                      </div>
                      <div className="metric-row">
                        <span>R² Score:</span>
                        <strong className="r2-score">{selectedModelVersion.metrics?.retailerToConsumer?.r2}</strong>
                      </div>
                      <div className="metric-row">
                        <span>MAPE:</span>
                        <strong>{selectedModelVersion.metrics?.retailerToConsumer?.mape}%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Explainability Breakdown */}
                  <h4 className="mt-4">Top Influencing Factors (Feature Importance)</h4>
                  <div className="factors-table-wrap">
                    <table className="ml-table">
                      <thead>
                        <tr>
                          <th>Factor Name</th>
                          <th>Impact Classification</th>
                          <th>Relative Importance Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(selectedModelVersion.top_factors?.farmerToIntermediary || []).map((f, i) => (
                          <tr key={i}>
                            <td><strong>{f.factor}</strong></td>
                            <td>
                              <span className={`impact-badge ${f.impact.toLowerCase().includes('high') ? 'high' : 'medium'}`}>
                                {f.impact}
                              </span>
                            </td>
                            <td>
                              <div className="weight-bar-wrap">
                                <div className="weight-bar-fill" style={{ width: `${Math.min(100, f.weight_pct)}%` }}></div>
                                <span className="weight-pct-text">{f.weight_pct}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="ml-card text-center p-4">Select a model version to view performance metrics.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 4: PREDICTION SANDBOX                            */}
      {/* ======================================================== */}
      {activeSubTab === 'sandbox' && (
        <div className="ml-tab-content">
          <div className="ml-split-layout">
            {/* Input Controls */}
            <div className="ml-left-pane">
              <div className="ml-card">
                <h3>🧪 Interactive Prediction Sandbox</h3>
                <p className="text-muted">Simulate market inputs to test active model price range generation across stages.</p>

                <div className="sandbox-form">
                  <div className="ml-form-group">
                    <label>Crop / Commodity</label>
                    <select
                      value={sandboxInput.crop}
                      onChange={e => setSandboxInput({ ...sandboxInput, crop: e.target.value })}
                    >
                      <option value="Tomato">Tomato (தக்காளி)</option>
                      <option value="Potato">Potato (உருளைக்கிழங்கு)</option>
                      <option value="Onion">Onion (வெங்காயம்)</option>
                      <option value="Chilli">Chilli (பச்சை மிளகாய்)</option>
                      <option value="Carrot">Carrot (கேரட்)</option>
                      <option value="Brinjal">Brinjal (கத்தரிக்காய்)</option>
                      <option value="Rice">Rice (அரிசி)</option>
                    </select>
                  </div>

                  <div className="ml-form-group">
                    <label>Current APMC Mandi Benchmark (₹/kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sandboxInput.mandi_price}
                      onChange={e => setSandboxInput({ ...sandboxInput, mandi_price: parseFloat(e.target.value) || 30 })}
                    />
                  </div>

                  <div className="ml-form-group">
                    <label>AI Quality Grade</label>
                    <select
                      value={sandboxInput.quality_grade}
                      onChange={e => setSandboxInput({ ...sandboxInput, quality_grade: e.target.value })}
                    >
                      <option value="Grade A">Grade A (Premium Quality)</option>
                      <option value="Grade B">Grade B (Standard Market Grade)</option>
                      <option value="Grade C">Grade C (Slight Blemishes / Markdown)</option>
                    </select>
                  </div>

                  <div className="ml-form-group">
                    <label>Quantity (kg)</label>
                    <input
                      type="number"
                      value={sandboxInput.quantity_kg}
                      onChange={e => setSandboxInput({ ...sandboxInput, quantity_kg: parseFloat(e.target.value) || 100 })}
                    />
                  </div>

                  <div className="ml-form-group">
                    <label>Market Demand Level</label>
                    <select
                      value={sandboxInput.demand_level}
                      onChange={e => setSandboxInput({ ...sandboxInput, demand_level: e.target.value })}
                    >
                      <option value="High">High Demand</option>
                      <option value="Medium">Medium Demand</option>
                      <option value="Low">Low Demand</option>
                    </select>
                  </div>

                  <button
                    className="ml-btn ml-btn-primary"
                    onClick={handleTestSandbox}
                    disabled={testingPrediction}
                  >
                    {testingPrediction ? 'Running ML Model...' : 'Calculate Fair Price Ranges'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Display */}
            <div className="ml-right-pane">
              {sandboxResult ? (
                <div className="ml-card">
                  <div className="rec-result-header">
                    <div>
                      <h3>ML Recommendation Results: {sandboxResult.crop}</h3>
                      <span className="grade-badge">{sandboxResult.qualityGrade}</span>
                      <span className="ref-badge">APMC Reference: ₹{sandboxResult.marketReferencePrice}/kg</span>
                    </div>
                    <span className="model-chip">
                      Model: {sandboxResult.model?.version} ({sandboxResult.model?.modelType})
                    </span>
                  </div>

                  {/* 3 Stage Price Ranges */}
                  <div className="rec-stages-display">
                    {/* Stage 1: Farmer */}
                    <div className="stage-box farmer">
                      <div className="stage-title">🌾 Stage 1: Farmer → Intermediary</div>
                      <div className="range-highlight">
                        ₹{sandboxResult.recommendations?.farmerToIntermediary?.lower} – ₹{sandboxResult.recommendations?.farmerToIntermediary?.upper}/kg
                      </div>
                      <div className="expected-callout">
                        Expected Fair Price: <strong>₹{sandboxResult.recommendations?.farmerToIntermediary?.expected}/kg</strong>
                      </div>
                      <div className="stage-hint">Protects farmer against mandi distress sales while pricing for quality.</div>
                    </div>

                    {/* Stage 2: Intermediary */}
                    <div className="stage-box inter">
                      <div className="stage-title">🤝 Stage 2: Intermediary → Retailer</div>
                      <div className="range-highlight">
                        ₹{sandboxResult.recommendations?.intermediaryToRetailer?.lower} – ₹{sandboxResult.recommendations?.intermediaryToRetailer?.upper}/kg
                      </div>
                      <div className="expected-callout">
                        Expected Fair Price: <strong>₹{sandboxResult.recommendations?.intermediaryToRetailer?.expected}/kg</strong>
                      </div>
                      <div className="stage-hint">Covers freight, transit logistics, and standard wholesale margin.</div>
                    </div>

                    {/* Stage 3: Retailer */}
                    <div className="stage-box retail">
                      <div className="stage-title">🏪 Stage 3: Retailer → Consumer</div>
                      <div className="range-highlight">
                        ₹{sandboxResult.recommendations?.retailerToConsumer?.lower} – ₹{sandboxResult.recommendations?.retailerToConsumer?.upper}/kg
                      </div>
                      <div className="expected-callout">
                        Expected Fair Price: <strong>₹{sandboxResult.recommendations?.retailerToConsumer?.expected}/kg</strong>
                      </div>
                      <div className="stage-hint">Provides consumers fair retail pricing while preventing predatory markups.</div>
                    </div>
                  </div>

                  {/* Factors Explainability */}
                  <div className="rec-factors-box mt-3">
                    <h4>Why this price range? (ML Feature Influence)</h4>
                    <div className="factors-pills-list">
                      {sandboxResult.explanation?.topFactors?.map((f, idx) => (
                        <div key={idx} className="factor-pill-item">
                          <span className="dot"></span>
                          <span className="f-name">{f.factor}</span>
                          <span className="f-impact">({f.impact})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="disclaimer-alert mt-3">
                    ⚖️ <strong>Regulatory Notice:</strong> {sandboxResult.disclaimer}
                  </div>
                </div>
              ) : (
                <div className="ml-card text-center p-4">Click "Calculate Fair Price Ranges" to test.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUBTAB 5: PRICE FAIRNESS ANALYTICS                      */}
      {/* ======================================================== */}
      {activeSubTab === 'analytics' && (
        <div className="ml-tab-content">
          <div className="ml-card">
            <h3>📉 Price Fairness Analytics (Recommended vs Actual)</h3>
            <p className="text-muted">
              Compares agreed on-chain blockchain transaction prices against the AI recommended fair price ranges.
            </p>

            <div className="fairness-summary-grid">
              <div className="fairness-box within">
                <span className="fairness-pct">{analyticsData?.summary?.withinRecommendedRangePct ?? 100}%</span>
                <span className="fairness-label">Within Recommended Range</span>
                <span className="fairness-sub">Compliant with fair market pricing</span>
              </div>
              <div className="fairness-box below">
                <span className="fairness-pct">{analyticsData?.summary?.belowRecommendedRangePct ?? 0}%</span>
                <span className="fairness-label">Below Recommended Range</span>
                <span className="fairness-sub">Potential distress or markdown transaction</span>
              </div>
              <div className="fairness-box above">
                <span className="fairness-pct">{analyticsData?.summary?.aboveRecommendedRangePct ?? 0}%</span>
                <span className="fairness-label">Above Recommended Range</span>
                <span className="fairness-sub">Premium trade or transit surcharge</span>
              </div>
            </div>

            <div className="analytics-details-section mt-4">
              <h4>Recent Batch Price Audit Log</h4>
              {analyticsData?.details?.length > 0 ? (
                <div className="ml-table-wrapper">
                  <table className="ml-table">
                    <thead>
                      <tr>
                        <th>Batch ID</th>
                        <th>Crop</th>
                        <th>Grade</th>
                        <th>Actual Price</th>
                        <th>Recommended Range</th>
                        <th>Difference</th>
                        <th>Fairness Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.details.map((row, i) => (
                        <tr key={i}>
                          <td><code>{row.batchId}</code></td>
                          <td><strong>{row.crop}</strong></td>
                          <td>{row.qualityGrade}</td>
                          <td><strong>₹{row.actualPrice}/kg</strong></td>
                          <td>₹{row.recommendedLower} – ₹{row.recommendedUpper} (Exp: ₹{row.recommendedExpected})</td>
                          <td className={row.difference < 0 ? 'text-danger' : 'text-success'}>
                            {row.difference > 0 ? `+₹${row.difference}` : `₹${row.difference}`} ({row.percentageDifference}%)
                          </td>
                          <td>
                            <span className={`fairness-status-pill ${row.fairnessStatus.toLowerCase().replace(/\s+/g, '-')}`}>
                              {row.fairnessStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-audit-notice p-4 text-center text-muted">
                  No batches with ML recommendation metadata recorded yet. Newly registered farmer and transfer batches will appear here automatically.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
