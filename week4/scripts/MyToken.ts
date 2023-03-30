import { ethers } from "hardhat";

async function main() {
    const currentTimestampInSeconds = Math.round(Date.now() / 1000);
    const unlockTime = currentTimestampInSeconds + 60;

    const MyTokenV1 = await ethers.getContractFactory("MyTokenV1");
    const myTokenV1 = await MyTokenV1.deploy();

    await myTokenV1.deployed();

    console.log(`MyTokenV1 deployed to ${myTokenV1.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
