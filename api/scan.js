const { spawn } = require('child_process');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { skillPath, format = 'json' } = req.body;
  if (!skillPath) {
    return res.status(400).json({ error: 'skillPath required' });
  }

  try {
    const skillspector = spawn('skillspector', [
      'scan',
      skillPath,
      '--no-llm',
      '--format',
      format
    ]);

    let output = '';
    let error = '';

    skillspector.stdout.on('data', (data) => {
      output += data.toString();
    });

    skillspector.stderr.on('data', (data) => {
      error += data.toString();
    });

    skillspector.on('close', (code) => {
      if (code === 0 || code === 1) {
        res.status(200).json({
          success: true,
          riskDetected: code === 1,
          report: format === 'json' ? JSON.parse(output) : output
        });
      } else {
        res.status(500).json({
          success: false,
          error: error || 'Scan failed'
        });
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
