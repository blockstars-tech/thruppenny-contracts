import { artifacts } from "hardhat";

const Bot = artifacts.require("BotContract");

const main = async () => {
  const bot = await Bot.new();

  console.log("bot address is ->", bot.address);
};

main()
  .then(() => console.log("success"))
  .catch((err) => console.log(err));
