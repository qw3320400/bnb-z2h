var LPToken = artifacts.require("LPToken");

module.exports = function(deployer, network, accounts) {
  // deploy contract
  deployer.deploy(LPToken);
};