const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { insertParameters, compile } = require('../services/template-compiler');
const solCompiler = require('../services/solidity-compiler');

router.post('/crowdfunding', async (req, res, next) => {
  console.log(req.body);

  let params = req.body;

  if (!params.title || !params.goal || !params.unit || !params.endDate || !params.receiver)
    res.status(401).send("Invalid input parameters");

  // template file for crowdfunding
  let filename = "sm_crowd-funding-template.plantuml";
  // Same name as in template file. Needed for naming the created .plantuml file with inserted
  // parameters
  let contractName = "CrowdfundingContract";
  // insert parameters into template
  insertParameters(params, filename, contractName);
  // insertParameters generated file with inserted values. Build path to this file
  let plantumlfilepath = path.join(__dirname, '..', 'out', `${contractName}.plantuml`)
  // Compile PlantUML to solidity .sol file
  let solFile;
  try {
    // if everything went fine => generated contract is in /tmp/contractName.sol
    solFile = await compile(plantumlfilepath, contractName);
  } catch (e) {
    console.error(e)
    res.status(500).end("Server error: " + e);
  }

  if (!fs.existsSync(solFile))
    res.status(500).end("Solidity file does not exist")

  // compile solidity file to byte code
  var bytecode = solCompiler.compile(fs.readFileSync(solFile, { encoding: 'utf8' }))
  res.setHeader('Content-Type', 'plain/text');
  res.status(200).send(bytecode);
  res.end();
  // var options = {
  //   root: path.join('/', 'tmp'),
  //   dotfiles: 'deny',
  //   headers: {
  //     'x-timestamp': Date.now(),
  //     'x-sent': true,
  //     'Content-Type': 'plain/text'
  //   }
  // }


  // res.status(200).sendFile(solidity, options, (err) => {
  //   if (err) {
  //     console.error(err);
  //     res.statusCode(500).end(err);
  //   }

  //   res.end();
  // });

  // res.render('index', { title: 'Express' });
});

module.exports = router;
