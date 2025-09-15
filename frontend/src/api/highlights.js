import api from './index';

/**
 * @param {string} pdfUuid 
 * @param {object} highlightData 
 * @returns {Promise<object>} 
 */
export const createHighlight = async (pdfUuid, highlightData) => {
  const response = await api.post(`/highlights/${pdfUuid}`, highlightData);
  return response.data;
};

/**
 * @param {string} pdfUuid 
 * @returns {Promise<array>}
 */
export const getHighlights = async (pdfUuid) => {
  const response = await api.get(`/highlights/${pdfUuid}`);
  return response.data;
};