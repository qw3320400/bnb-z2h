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
        assert.equal((await minning.tokenMintEachBlock()).toString(), "100000000000000000000", "tokenMintEachBlock owner error");
    })
    it("add pool", async() => {
        let minning = await Minning.deployed();
        let lptoken = await LPToken.deployed();
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
    })
    it("prepare lp balance and approval", async() => {
        let minning = await Minning.deployed();
        let lptoken = await LPToken.deployed();
        assert.equal((await lptoken.totalSupply()).toString(), "0", "lptoken totalSupply error");
        await lptoken.mint(accounts[1], "1000000000000000000000");
        await lptoken.mint(accounts[2], "1000000000000000000000");
        await lptoken.mint(accounts[3], "1000000000000000000000");
        assert.equal((await lptoken.balanceOf(accounts[1])).toString(), "1000000000000000000000", "accounts1 balance error");
        assert.equal((await lptoken.balanceOf(accounts[2])).toString(), "1000000000000000000000", "accounts2 balance error");
        assert.equal((await lptoken.balanceOf(accounts[3])).toString(), "1000000000000000000000", "accounts3 balance error");
        await lptoken.approve(minning.address, "10000000000000000000000", {from: accounts[1]});
        await lptoken.approve(minning.address, "10000000000000000000000", {from: accounts[2]});
        await lptoken.approve(minning.address, "10000000000000000000000", {from: accounts[3]});
        assert.equal((await lptoken.allowance(accounts[1], minning.address)).toString(), "10000000000000000000000", "accounts1 allowance error");
        assert.equal((await lptoken.allowance(accounts[2], minning.address)).toString(), "10000000000000000000000", "accounts1 allowance error");
        assert.equal((await lptoken.allowance(accounts[3], minning.address)).toString(), "10000000000000000000000", "accounts1 allowance error");
    })
    it("reward minning", async() => {
        let minning = await Minning.deployed();
        let rewardtoken = await RewardToken.at(await minning.rewardToken());
        let lastRewardBlock = BigInt(await minning.lastRewardBlock());
        let pool0 = await minning.getPoolInfo(0);
        let pool1 = await minning.getPoolInfo(1);
        assert.equal(BigInt(pool0["totalReward"]), BigInt("100000000000000000000")*lastRewardBlock, "pool0 reward error");
        assert.equal(pool1["totalReward"].toString(), "0", "pool1 reward error");
        await increase(10);
        await minning.testMintRewardToken();
        latestBlock = BigInt(await minning.lastRewardBlock());
        pool0 = await minning.getPoolInfo(0);
        pool1 = await minning.getPoolInfo(1);
        let reward = (latestBlock-lastRewardBlock)*BigInt("100000000000000000000")/BigInt(100)
        assert.equal(BigInt(pool0["totalReward"]), BigInt("100000000000000000000")*lastRewardBlock+reward*BigInt(70), "pool0 reward error");
        assert.equal(BigInt(pool1["totalReward"]), reward*BigInt(30), "pool1 reward error");
        assert.equal(BigInt(await rewardtoken.balanceOf(minning.address)), BigInt("100000000000000000000")*latestBlock, "minning balance error");
    })
    it("deposit withdraw", async() => {
        let minning = await Minning.deployed();
        console.log("block:", await web3.eth.getBlockNumber());
        await minning.deposit(0, "1000000000000000000000", {from: accounts[1]});
        console.log("block:", await web3.eth.getBlockNumber());
        await minning.deposit(0, "1000000000000000000000", {from: accounts[2]});
        console.log("block:", await web3.eth.getBlockNumber());
        await minning.deposit(1, "1000000000000000000000", {from: accounts[3]});
        console.log("block:", await web3.eth.getBlockNumber());
        let pool0 = await minning.getPoolInfo(0);
        let pool1 = await minning.getPoolInfo(1);
        assert.equal(BigInt(pool0["depositAmount"]), BigInt("2000000000000000000000"), "pool0 depositAmount error");
        assert.equal(BigInt(pool1["depositAmount"]), BigInt("1000000000000000000000"), "pool1 depositAmount error");
        console.log("reward:", 
            (await minning.claimable(0, {from: accounts[1]})).toString(),
            (await minning.claimable(0, {from: accounts[2]})).toString(),
            (await minning.claimable(1, {from: accounts[3]})).toString()
        );
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