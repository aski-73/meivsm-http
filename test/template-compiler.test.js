const assert = require('assert');
const path = require('path');
const fs = require('fs');
const { insertParameters, compile, escapeBlanks } = require('../services/template-compiler')

/**
 * Unit Test (except last test case: more like a integration test, because access to filesystem)
 */
describe("TemplateCompiler", () => {

    it("should correctly escape blanks", () => {
        // GIVEN
        let escapeMe = "I am a Text with many blanks";

        // WHEN
        let escapedText = escapeBlanks(escapeMe);

        // THEN
        let expected = "I\\ am\\ a\\ Text\\ with\\ many\\ blanks";

        assert(escapedText == expected);
    });


    it("should insert parameters correctly", () => {
        // GIVEN
        let filename = "sm_crowd-funding-template.plantuml";

        // WHEN
        let result = insertParameters(params, filename, "CrowdfundingContract");

        // THEN
        let expected = `@startuml CrowdfundingContract
skinparam Monochrome true
skinparam Shadowing false

[*] --> created: init
created: entry/ company: address = ${params.receiver}
created: entry/ endDate: uint = ${params.endDate}
created: entry/ title: string = "${params.title}"
created: entry/ goal: uint = ${params.goal} ${params.unit}
funding: entry/ sum: uint = sum + msg.value
failed: entry/ returnPayments()
successful: entry/ transfer(sum + msg.value , company)
successful: entry/ sum = sum + msg.value
created --> funding: pay* [now <= endDate & msg.value < goal]
funding --> funding: pay* [now <= endDate & sum + msg.value < goal]
created --> successful: pay* [now <= endDate & msg.value >= goal]
created --> failed: pay* [now > endDate]

funding --> successful: pay* [sum + msg.value >= goal & now <= endDate]
funding --> failed: pay* [now > endDate]
failed --> [*]: exit
successful --> [*]: exit
@enduml`;

        assert.equal(expected.trim(), result.trim());
    });

    it("should compile correctly and place compiled contract in tmp folder", async () => {
        // GIVEN
        let contractName = "CrowdfundingContract";

        let filename = "sm_crowd-funding-template.plantuml";
        insertParameters(params, filename, contractName);

        // WHEN
        let plantumlFilePath = path.join(__dirname, '..', 'out', `${contractName}.plantuml`)
        let compiledContractPath = await compile(plantumlFilePath, contractName);
		console.log(compiledContractPath)
        // THEN
        assert(fs.existsSync(compiledContractPath) == true);
        assert.equal(fs.readFileSync(compiledContractPath, { encoding: 'utf8' }).trim(), expectedSolFileContent.trim())
    });
});

const params = {
    title: "MY Project",
    goal: 5,
    unit: "ether",
    endDate: 123454321,
    receiver: "0xSomeAdress"
}

const expectedSolFileContent = `pragma solidity >=0.5.0 <0.7.0;

contract CrowdfundingContract {
	string public state = "START";
	struct Sender {
		address payable addr;
		uint date;
		uint val;
	}
	Sender[] public senders;
	mapping(address => Sender) public senderMap;
	address payable public company;
	uint public endDate;
	string public title;
	uint public goal;
	uint public sum;
	function handle(string memory input) public payable {
		if (isEqual(state, "START") && isEqual(input, "init")) {
			state = "CREATED";
			//Entry Activity of new State
			company = ${params.receiver};
			endDate = ${params.endDate};
			title = "${params.title}";
			goal = ${params.goal} ${params.unit};
		}
		else if (isEqual(state, "CREATED") && isEqual(input, "pay*") && now <= endDate && msg.value < goal) {
			Sender memory s = Sender(msg.sender, now, msg.value);
			addSender(s);
			state = "FUNDING";
			//Entry Activity of new State
			sum = sum + msg.value;
		}
		else if (isEqual(state, "FUNDING") && isEqual(input, "pay*") && now <= endDate && sum + msg.value < goal) {
			Sender memory s = Sender(msg.sender, now, msg.value);
			addSender(s);
			state = "FUNDING";
			//Entry Activity of new State
			sum = sum + msg.value;
		}
		else if (isEqual(state, "CREATED") && isEqual(input, "pay*") && now <= endDate && msg.value >= goal) {
			Sender memory s = Sender(msg.sender, now, msg.value);
			addSender(s);
			state = "SUCCESSFUL";
			//Entry Activity of new State
			transfer(sum + msg.value, company);
			sum = sum + msg.value;
		}
		else if (isEqual(state, "CREATED") && isEqual(input, "pay*") && now > endDate) {
			Sender memory s = Sender(msg.sender, now, msg.value);
			addSender(s);
			state = "FAILED";
			//Entry Activity of new State
			returnPayments();
		}
		else if (isEqual(state, "FUNDING") && isEqual(input, "pay*") && sum + msg.value >= goal && now <= endDate) {
			Sender memory s = Sender(msg.sender, now, msg.value);
			addSender(s);
			state = "SUCCESSFUL";
			//Entry Activity of new State
			transfer(sum + msg.value, company);
			sum = sum + msg.value;
		}
		else if (isEqual(state, "FUNDING") && isEqual(input, "pay*") && now > endDate) {
			Sender memory s = Sender(msg.sender, now, msg.value);
			addSender(s);
			state = "FAILED";
			//Entry Activity of new State
			returnPayments();
		}
		else if (isEqual(state, "FAILED") && isEqual(input, "exit")) {
			state = "END";
		}
		else if (isEqual(state, "SUCCESSFUL") && isEqual(input, "exit")) {
			state = "END";
		}
	}

	function isEqual(string memory a, string memory b) public pure returns (bool) {
		return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
	}

	function transfer(uint amount, address payable receiver) private {
		address self = address(this);
		uint256 balance = self.balance;
		if (balance >= amount)
			receiver.transfer(amount);
	}
	function returnPayments() private {
		for (uint i = 0; i < senders.length; i++)
			transfer(senderMap[senders[i].addr].val, senders[i].addr);
	}
	function addSender(Sender memory s) private {
		if (senderMap[s.addr].addr == address(0)) {
			senders.push(s);
			senderMap[s.addr] = s;
		} else {
			senderMap[s.addr].val += s.val;
		}
	}
}`;