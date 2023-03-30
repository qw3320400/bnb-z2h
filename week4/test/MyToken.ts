import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

var myTokenV1Address;
var myTokenV2Address;
var proxyAddress;

describe("MyToken", function () {

    describe("Deployment", function () {

        it("deploy MyTokenV1", async function () {
            const MyTokenV1 = await ethers.getContractFactory("MyTokenV1");
            const myTokenV1 = await MyTokenV1.deploy();
            await myTokenV1.deployed();
            myTokenV1Address = myTokenV1.address;
            expect(await myTokenV1.name()).equal("MyTokenV1");
            expect(await myTokenV1.symbol()).equal("MT1");
        });

        it("deploy MyTokenV2", async function () {
            const MyTokenV2 = await ethers.getContractFactory("MyTokenV2");
            const myTokenV2 = await MyTokenV2.deploy();
            await myTokenV2.deployed();
            myTokenV2Address = myTokenV2.address;
            expect(await myTokenV2.name()).equal("MyTokenV2");
            expect(await myTokenV2.symbol()).equal("MT2");
        });

        it("deploy TransparentUpgradeableProxy", async function () {
            const accounts = await ethers.provider.listAccounts();
            const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
            const proxy = await Proxy.deploy(myTokenV1Address, accounts[0], []);
            await proxy.deployed();
            proxyAddress = proxy.address;
            expect(await proxy.callStatic.implementation()).equal(myTokenV1Address);

            const account1 = await ethers.getSigner(accounts[1]);
            const MyTokenV1 = await ethers.getContractFactory("MyTokenV1");
            const myToken = await MyTokenV1.attach(proxyAddress.toString());
            expect(await myToken.connect(account1).initialized()).equal(false);
        });

    });

    describe("initialize", function () {

        it("initialize MyTokenV1", async function () {
            const MyTokenV1 = await ethers.getContractFactory("MyTokenV1");
            const myTokenV1 = await MyTokenV1.attach(myTokenV1Address.toString());
            await myTokenV1.calculateZ(3);
            expect(await myTokenV1.z()).equal(3);
            await myTokenV1.initialize();
            await myTokenV1.calculateZ(4);
            expect(await myTokenV1.z()).equal(7);
            await expect(myTokenV1.initialize()).to.be.revertedWith("already initialized");
        });

        it("initialize MyTokenV2", async function () {
            const MyTokenV2 = await ethers.getContractFactory("MyTokenV2");
            const myTokenV2 = await MyTokenV2.attach(myTokenV2Address.toString());
            await myTokenV2.calculateZ(3);
            expect(await myTokenV2.z()).equal(0);
            await myTokenV2.initialize();
            await myTokenV2.calculateZ(4);
            expect(await myTokenV2.z()).equal(12);
            await expect(myTokenV2.initialize()).to.be.revertedWith("already initialized");
        });

        it("initialize TransparentUpgradeableProxy", async function () {
            const accounts = await ethers.provider.listAccounts();
            const account1 = await ethers.getSigner(accounts[1]);
            const Proxy = await ethers.getContractFactory("MyTokenV1");
            const proxy = await Proxy.attach(proxyAddress.toString());
            await proxy.connect(account1).calculateZ(3);
            expect(await proxy.connect(account1).z()).equal(3);
            await proxy.connect(account1).initialize();
            await proxy.connect(account1).calculateZ(4);
            expect(await proxy.connect(account1).z()).equal(7);
            await expect(proxy.connect(account1).initialize()).to.be.revertedWith("already initialized");
        });

    });

    describe("upgrade", function () {

        it("upgrade implimentation", async function () {
            const Proxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
            const proxy = await Proxy.attach(proxyAddress.toString());
            const MyTokenV2 = await ethers.getContractFactory("MyTokenV2");
            const myTokenV2 = await MyTokenV2.attach(myTokenV2Address.toString());
            await proxy.upgradeTo(myTokenV2Address.toString());
            
            const accounts = await ethers.provider.listAccounts();
            const account1 = await ethers.getSigner(accounts[1]);
            const myToken = await MyTokenV2.attach(proxyAddress.toString());
            expect(await myToken.connect(account1).z()).equal(7);
            await myToken.connect(account1).calculateZ(5);
            expect(await myToken.connect(account1).z()).equal(15);
        })

    });

});
