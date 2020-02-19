const solc = require('solc')

/**
 * Compiles a solidity file and returns its bytecode
 * 
 * @param {string} data contract code in solidity
 * 
 * @returns bytecode
 */
const compile = (data) => {
    var input = {
        language: 'Solidity',
        sources: {
            'contract.sol': {
                content: data
            }
        },
        settings: {
            outputSelection: {
                '*': {
                    '*': ['*']
                }
            }
        }
    }
    // output like from truffle compile build/contracts/*.json
    let output = JSON.parse(solc.compile(JSON.stringify(input)))
    for (let contractName in output.contracts['contract.sol']) {
        // console.log(
        //     contractName +
        //     ': ' +
        //     output.contracts['contract.sol'][contractName].evm.bytecode.object
        // );
        // only bytecode is needed. since only one contract is compiled return from inside for loop
        return output.contracts['contract.sol'][contractName].evm.bytecode.object;
    }
}

module.exports = { compile }