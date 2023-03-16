var LPToken = artifacts.require("LPToken");

contract("LPToken", async accounts => {
    it("init lptoken", async() => {
        let lptoken = await LPToken.deployed();
        assert.equal((await lptoken.owner()), accounts[0], "contract owner error");
        assert.equal((await lptoken.name()), "My LPToken", "contract name error");
        assert.equal((await lptoken.symbol()), "My-LP", "contract symbol error");
        assert.equal((await lptoken.decimals()).toString(), "18", "contract decimals error");
        assert.equal((await lptoken.totalSupply()).toString(), "0", "contract totalSupply error");
        assert.equal((await lptoken.maxSupply()).toString(), "1000000000000000000000000000", "contract maxSupply error");
        assert.equal((await lptoken.balanceOf(accounts[0])).toString(), "0", "accounts0 balance error");
        assert.equal((await lptoken.balanceOf(accounts[1])).toString(), "0", "accounts1 balance error");
        assert.equal((await lptoken.allowance(accounts[0], accounts[1])).toString(), "0", "allowance error");
    })
    it("mint lptoken", async() => {
        let lptoken = await LPToken.deployed();
        await lptoken.mint(accounts[0], "9000");
        await lptoken.mint(accounts[1], "1000");
        assert.equal((await lptoken.totalSupply()).toString(), "10000", "contract totalSupply error");
        assert.equal((await lptoken.maxSupply()).toString(), "1000000000000000000000000000", "contract maxSupply error");
        assert.equal((await lptoken.balanceOf(accounts[0])).toString(), "9000", "accounts0 balance error");
        assert.equal((await lptoken.balanceOf(accounts[1])).toString(), "1000", "accounts1 balance error");
    })
    it("approve and transfer lptoken", async() => {
        let lptoken = await LPToken.deployed();
        await lptoken.transfer(accounts[2], "2000");
        assert.equal((await lptoken.balanceOf(accounts[2])).toString(), "2000", "accounts2 balance error");
        await lptoken.approve(accounts[0], "10000", {from: accounts[2]});
        assert.equal((await lptoken.allowance(accounts[2], accounts[0])).toString(), "10000", "accounts2 allowance error");
        await lptoken.transferFrom(accounts[2], accounts[3], "1000");
        assert.equal((await lptoken.allowance(accounts[2], accounts[0])).toString(), "9000", "accounts2 allowance error");
        assert.equal((await lptoken.balanceOf(accounts[1])).toString(), "1000", "accounts2 balance error");
        assert.equal((await lptoken.balanceOf(accounts[2])).toString(), "1000", "accounts2 balance error");
        assert.equal((await lptoken.balanceOf(accounts[3])).toString(), "1000", "accounts2 balance error");
        assert.equal((await lptoken.totalSupply()).toString(), "10000", "contract totalSupply error");
        assert.equal((await lptoken.maxSupply()).toString(), "1000000000000000000000000000", "contract maxSupply error");
    })
})