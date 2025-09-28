import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { command, args } = req.body;

    if (!command || !args) {
      return res.status(400).json({ error: 'Missing command or args' });
    }

    // Validate command is the expected LayerZero OFT send
    if (command !== 'lz:oft:send') {
      return res.status(400).json({ error: 'Invalid command' });
    }

    // Build the hardhat command
    const hardhatPath = path.join(process.cwd(), 'Hedera-OP', 'my-lz-oapp');
    let hardhatCommand = `cd "${hardhatPath}" && npx hardhat ${command}`;
    
    // Add the arguments
    for (const [key, value] of Object.entries(args)) {
      hardhatCommand += ` --${key} ${value}`;
    }

    console.log('Executing command:', hardhatCommand);

    // Execute the command
    const { stdout, stderr } = await execAsync(hardhatCommand, {
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    console.log('Command output:', stdout);
    if (stderr) {
      console.log('Command stderr:', stderr);
    }

    return res.status(200).json({
      success: true,
      output: stdout,
      error: stderr || null,
      command: hardhatCommand
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
