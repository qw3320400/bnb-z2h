var Minning = artifacts.require("Minning");
var RewardToken = artifacts.require("RewardToken");
var LPToken = artifacts.require("LPToken");

contract("Minning", async accounts => {
    it("init minning", async() => {
        let minning = await Minning.deployed();
        // owner
        assert.equal((await minning.owner()), accounts[0], "contract owner error");
        let rewardtoken = await RewardToken.at(await minning.rewardToken());
        assert.equal((await rewardtoken.owner()), minning.address, "rewardtoken owner error");
        // pool
        assert.equal((await minning.getPoolLength()).toString(), "0", "pool length error");
        // minning
        assert.equal((await minning.startRewardBlock()).toString(), "0", "startRewardBlock owner error");
        assert.equal((await minning.lastRewardBlock()).toString(), "0", "lastRewardBlock owner error");
        assert.equal((await minning.tokenMintEachBlock()).toString(), "10000", "tokenMintEachBlock owner error");
    })
    it("add pool", async() => {
        let minning = await Minning.deployed();
        let lptoken = await LPToken.deployed();
        let rewardtoken = await RewardToken.at(await minning.rewardToken());
        // pool0
        await minning.addPool(lptoken.address, 70);
        assert.equal((await minning.getPoolLength()).toString(), "1", "pool length error");
        let pool0 = await minning.getPoolInfo(0);
        assert.equal(pool0["lpToken"], lptoken.address, "lpToken error");
        assert.equal(pool0["weight"].toString(), "70", "pool weight error");
        // pool1
        await minning.addPool(lptoken.address, 30);
        assert.equal((await minning.getPoolLength()).toString(), "2", "pool length error");
        let pool1 = await minning.getPoolInfo(1);
        assert.equal(pool1["lpToken"], lptoken.address, "lpToken error");
        assert.equal(pool1["weight"].toString(), "30", "pool weight error");
        // minning reward
        await minning.testMintRewardToken();
        let block = BigInt(await minning.lastRewardBlock());
        pool0 = await minning.getPoolInfo(0);
        pool1 = await minning.getPoolInfo(1);
        assert.equal(BigInt(pool0["rewardPerLPToken"]), 0, "pool0 rewardPerLPToken error");
        assert.equal(BigInt(pool1["rewardPerLPToken"]), 0, "pool1 rewardPerLPToken error");
        assert.equal(BigInt(await rewardtoken.balanceOf(minning.address)), BigInt("10000")*block, "minning reward balance error");
    })
    it("prepare lp balance and approval", async() => {
        let minning = await Minning.deployed();
        let lptoken = await LPToken.deployed();
        assert.equal((await lptoken.totalSupply()).toString(), "0", "lptoken totalSupply error");
        await lptoken.mint(accounts[1], "100");
        await lptoken.mint(accounts[2], "100");
        await lptoken.mint(accounts[3], "100");
        assert.equal((await lptoken.balanceOf(accounts[1])).toString(), "100", "accounts1 balance error");
        assert.equal((await lptoken.balanceOf(accounts[2])).toString(), "100", "accounts2 balance error");
        assert.equal((await lptoken.balanceOf(accounts[3])).toString(), "100", "accounts3 balance error");
        await lptoken.approve(minning.address, "1000", {from: accounts[1]});
        await lptoken.approve(minning.address, "1000", {from: accounts[2]});
        await lptoken.approve(minning.address, "1000", {from: accounts[3]});
        assert.equal((await lptoken.allowance(accounts[1], minning.address)).toString(), "1000", "accounts1 allowance error");
        assert.equal((await lptoken.allowance(accounts[2], minning.address)).toString(), "1000", "accounts2 allowance error");
        assert.equal((await lptoken.allowance(accounts[3], minning.address)).toString(), "1000", "accounts3 allowance error");
    })
    it("deposit withdraw", async() => {
        let minning = await Minning.deployed();
        let lptoken = await LPToken.deployed();
        let rewardtoken = await RewardToken.at(await minning.rewardToken());
        // deposit
        await minning.deposit(0, "100", {from: accounts[1]});
        let block1 = BigInt(await minning.lastRewardBlock());
        await minning.deposit(0, "100", {from: accounts[2]});
        let block2 = BigInt(await minning.lastRewardBlock());
        await minning.deposit(1, "100", {from: accounts[3]});
        let block3 = BigInt(await minning.lastRewardBlock());
        let pool0 = await minning.getPoolInfo(0);
        let pool1 = await minning.getPoolInfo(1);
        let decimal = BigInt(await minning.DECIMAL());
        assert.equal(BigInt(pool0["lpTokenAmount"]), BigInt("200"), "pool0 lpToken error");
        assert.equal(BigInt(pool1["lpTokenAmount"]), BigInt("100"), "pool1 lpToken error");
        assert.equal(
            BigInt(pool0["rewardPerLPToken"]), 
            (block2-block1)*BigInt("10000")*decimal*BigInt(70)/BigInt(100)/BigInt(100) + 
                (block3-block2)*BigInt("10000")*decimal*BigInt(70)/BigInt(100)/BigInt(200), 
            "pool0 rewardPerLPToken error");
        assert.equal(BigInt(pool1["rewardPerLPToken"]), 0, "pool1 rewardPerLPToken error");
        assert.equal(
            BigInt((await minning.claimable(0, {from: accounts[1]}))), 
            (block2-block1)*BigInt("10000")*BigInt(70)/BigInt(100) +
                (block3-block2)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2),
            "accounts1 claimable error");
        assert.equal(
            BigInt((await minning.claimable(0, {from: accounts[2]}))), 
            (block3-block2)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2),
            "accounts2 claimable error");
        assert.equal(
            BigInt((await minning.claimable(1, {from: accounts[3]}))), 
            0, 
            "accounts3 claimable error");
        // withdraw
        await minning.withdraw(0, "50", {from: accounts[1]});
        let block4 = BigInt(await minning.lastRewardBlock());
        assert.equal((await lptoken.balanceOf(accounts[1])).toString(), "50");
        assert.equal(
            BigInt((await rewardtoken.balanceOf(accounts[1]))), 
            (block2-block1)*BigInt("10000")*BigInt(70)/BigInt(100) + 
                (block3-block2)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2) +
                (block4-block3)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2), 
            "accounts1 balance error");
        assert.equal(
            BigInt((await minning.claimable(0, {from: accounts[2]}))), 
            (block3-block2)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2) +
                (block4-block3)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2),
            "accounts2 claimable error");
        assert.equal(
            BigInt((await minning.claimable(1, {from: accounts[3]}))), 
            (block4-block3)*BigInt("10000")*BigInt(30)/BigInt(100), 
            "accounts3 claimable error");
        // claim
        await minning.claim(0, {from: accounts[2]});
        let block5 = BigInt(await minning.lastRewardBlock());
        assert.equal(
            BigInt((await rewardtoken.balanceOf(accounts[2]))), 
            (block3-block2)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2) +
                (block4-block3)*BigInt("10000")*BigInt(70)/BigInt(100)/BigInt(2) +
                (block5-block4)*BigInt("10000")*BigInt(70)/BigInt(100)*BigInt(2)/BigInt(3),
            "accounts2 balance error");
    })

})

async function increase(duration) {
    return new Promise((resolve, reject) => {
        web3.currentProvider.send({
            jsonrpc: "2.0",
            method: "evm_increaseTime",
            params: [duration],
            id: new Date().getTime()
        }, (err, result) => {
            // second call within the callback
            web3.currentProvider.send({
                jsonrpc: '2.0',
                method: 'evm_mine',
                params: [],
                id: new Date().getTime()
            }, (err, result) => {
                // need to resolve the Promise in the second callback
                resolve();
            });
        });
    });
};