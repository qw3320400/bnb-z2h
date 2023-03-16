var Minning = artifacts.require("Minning");

module.exports = function(deployer, network, accounts) {
  // deploy contract
  deployer.deploy(Minning, 0, "100000000000000000000");
};