import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const solc = require('solc');

interface CompiledContract {
  abi: object[];
  bytecode: string;
}

let cached: CompiledContract | null = null;

export function compileERC20(): CompiledContract {
  if (cached) return cached;

  const contractPath = path.resolve(process.cwd(), 'contracts', 'SimpleERC20.sol');
  const source = fs.readFileSync(contractPath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'SimpleERC20.sol': { content: source },
    },
    settings: {
      outputSelection: {
        '*': { '*': ['abi', 'evm.bytecode.object'] },
      },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const fatal = output.errors.filter((e: { severity: string }) => e.severity === 'error');
    if (fatal.length > 0) {
      throw new Error(`Solidity compilation failed:\n${fatal.map((e: { message: string }) => e.message).join('\n')}`);
    }
  }

  const contract = output.contracts['SimpleERC20.sol']['SimpleERC20'];
  cached = {
    abi: contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object,
  };

  return cached;
}
