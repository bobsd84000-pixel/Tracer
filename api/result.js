const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reportId } = req.query;
  if (typeof reportId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(reportId)) {
    return res.status(400).json({ error: 'valid reportId required' });
  }

  try {
    const reportPath = path.join(process.cwd(), 'reports', `${reportId}.json`);
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    res.status(200).json(report);
  } catch (err) {
    res.status(404).json({ error: 'Report not found' });
  }
};
