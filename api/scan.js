const { spawn } = require('child_process');

const ALLOWED_FORMATS = ['json', 'markdown', 'terminal'];
const GITHUB_URL = /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/?$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { skillPath, format = 'json' } = req.body || {};
  if (typeof skillPath !== 'string' || !GITHUB_URL.test(skillPath)) {
    return res.status(400).json({ error: 'skillPath must be a https://github.com/<owner>/<repo> URL' });
  }
  if (!ALLOWED_FORMATS.includes(format)) {
    return res.status(400).json({ error: `format must be one of: ${ALLOWED_FORMATS.join(', ')}` });
  }

  const skillspector = spawn('skillspector', ['scan', skillPath, '--no-llm', '--format', format]);

  let output = '';
  let error = '';
  let done = false;
  const reply = (status, body) => {
    if (done) return;
    done = true;
    res.status(status).json(body);
  };

  skillspector.stdout.on('data', (data) => {
    output += data.toString();
  });

  skillspector.stderr.on('data', (data) => {
    error += data.toString();
  });

  skillspector.on('error', (err) => {
    reply(500, { success: false, error: `Cannot run skillspector: ${err.message}` });
  });

  skillspector.on('close', (code) => {
    if (code !== 0 && code !== 1) {
      return reply(500, { success: false, error: error || 'Scan failed' });
    }
    let report = output;
    if (format === 'json') {
      try {
        report = JSON.parse(output);
      } catch {
        return reply(500, { success: false, error: 'Invalid JSON report from skillspector' });
      }
    }
    reply(200, { success: true, riskDetected: code === 1, report });
  });
};
