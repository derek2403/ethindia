import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command, scriptName } = req.body;

    // Validate command is the expected LayerZero OFT send
    if (command !== 'lz:oft:send') {
      return res.status(400).json({ error: 'Invalid command' });
    }

    // Build the shell script command with correct environment
    const scriptPath = path.join(process.cwd(), 'Hedera-OP', 'my-lz-oapp');
    const shellScript = scriptName || 'hedera.sh'; // Default to hedera.sh
    
    // Read the environment file from the Hedera directory to get the correct PRIVATE_KEY
    const fs = require('fs');
    const envPath = path.join(scriptPath, '.env');
    let hederaEnv = {};
    
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
          hederaEnv[key.trim()] = value.trim();
        }
      });
    } catch (error) {
      console.log('Warning: Could not read Hedera .env file:', error.message);
    }
    
    const shellCommand = `cd "${scriptPath}" && ./${shellScript}`;
    console.log('Executing shell script:', shellCommand);

    // Execute the shell script with the correct environment variables
    const { stdout, stderr } = await execAsync(shellCommand, {
      timeout: 60000, // 60 second timeout (increased for LayerZero operations)
      maxBuffer: 1024 * 1024, // 1MB buffer
      env: {
        ...process.env, // Include existing environment
        ...hederaEnv,   // Override with Hedera-specific environment
      }
    });

    console.log('Command output:', stdout);
    if (stderr) {
      console.log('Command stderr:', stderr);
    }

    return res.status(200).json({
      success: true,
      output: stdout,
      error: stderr || null,
      command: shellCommand
    });

  } catch (error) {
    console.error('Command execution failed:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      output: error.stdout || null,
      stderr: error.stderr || null
    });
  }
}
