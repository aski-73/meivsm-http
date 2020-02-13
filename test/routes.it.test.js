const app = require('../app');
const assert = require('assert');
const request = require('supertest')

describe('Testing routing endpoint /crowdfunding', () => {
        it('should create and return compiled solidity bytecode', async () => {
                // GIVEN
                let params = {
                        title: "MYProject",
                        goal: 5,
                        unit: "ether",
                        endDate: Math.floor((new Date()).getTime()),
                        receiver: "0x7F181DeF2E46196a239aC423a2b77e2E6A4d54a6"
                }

                // WHEN
                const res = await request(app)
                        .post('/crowdfunding')
                        .send(params);

                // THEN
                // console.log(res.text);
                assert(res.statusCode == 200);
        })
})