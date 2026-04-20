import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const uploadDocument = async (formData) => {
  const response = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // Expected { upload_id: string }
};

export const getQualityReport = async (uploadId) => {
  const response = await api.get(`/quality-report/${uploadId}`);
  return response.data; 
  /* Expected: {
    status: string,
    overall_score: number,
    decision: string,
    checks: array,
    rag_context: object,
    audit: object
  } */
};

export const submitHumanReview = async (uploadId, reviewData) => {
  // reviewData: { reviewer_id, reviewer_name, decision, reason_code, notes }
  const response = await api.post(`/human-review/${uploadId}`, reviewData);
  return response.data;
};

export const getDashboardStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const getKBList = async () => {
  const response = await api.get('/kb/list');
  return response.data;
};

export const getKBFile = async (category, filename) => {
  const response = await api.get(`/kb/file/${category}/${filename}`);
  return response.data;
};
export const getReports = async () => {
  const response = await api.get('/reports');
  return response.data;
};

export const getQueueCount = async () => {
  const response = await api.get('/queue/count');
  return response.data;
};
export const deleteReport = async (uploadId) => {
  const response = await api.delete(`/reports/${uploadId}`);
  return response.data;
};

export const deleteReportsBulk = async (uploadIds) => {
  const response = await api.post('/reports/delete-bulk', { upload_ids: uploadIds });
  return response.data;
};

export const getTrashReports = async () => {
  const response = await api.get('/trash');
  return response.data;
};

export const restoreReports = async (uploadIds) => {
  const response = await api.post('/trash/restore', { upload_ids: uploadIds });
  return response.data;
};

export const emptyTrash = async () => {
  const response = await api.delete('/trash/empty');
  return response.data;
};

export const permanentDeleteReport = async (uploadId) => {
  const response = await api.delete(`/trash/${uploadId}`);
  return response.data;
};

export const deleteReportsPermanentBulk = async (uploadIds) => {
  const response = await api.post('/trash/delete-bulk', { upload_ids: uploadIds });
  return response.data;
};

export const getApiHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};
