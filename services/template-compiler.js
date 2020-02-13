const fs = require('fs');
const path = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * replaces each attribute in "params" with template key word
 * 
 * Usage (for Example crowdfunding contract):
 * 
 * params: object e.g.: {goal: "5", goalUnit: "ether", title: "MyProject", endDate: "1235423213", receiver: "0x..."}
 * fileName: String : a file in templates-dir that must contain "@attribute"-marks for each attribute
 * in the params object 
 */
const insertParameters = (params, fileName, contractName) => {

    // read template
    let data = fs.readFileSync(path.join(__dirname, '..', 'templates', fileName), 'utf8');

    let result = data;
    for (let i in params) {
        // console.log("index: " + i + ", value: " + params[i]);
        result = result.replace(new RegExp(`@${i}`, 'g'), params[i]);
    }


    fs.writeFileSync(path.join(__dirname, '..', 'out', `${contractName}.plantuml`), result, 'utf8');

    return result;
}

/**
 * Compiles Smart Contract defined in PlantUML file to Solidity file
 * @param {string} filePath Absolute Path to plantuml file
 */
const compile = async (filePath) => {
    let compilerPath = path.join(__dirname, '..', '..', 'meivsm-compiler', 'target', 'meivsm-compiler-1.0.jar');
    compilerPath = escapeBlanks(compilerPath);
    filePath = escapeBlanks(filePath);

    // compiler prints path to compiled contract to stdout
    const { stdout, stderr } = await exec(`/usr/bin/java -jar ${compilerPath} ${filePath}`);
    if (stderr) {
        console.log(stderr)
        throw Error(stderr)
    }

    return stdout.trim();
}

/**
 * 
 * @param {string} text 
 */
const escapeBlanks = (text) => {
    let escapedText = "";
    for (let i = 0; i < text.length; i++) {
        if (text.charAt(i) == " ")
            escapedText += "\\ ";
        else
            escapedText += text.charAt(i);
    }

    return escapedText
}

module.exports = { insertParameters, compile, escapeBlanks }