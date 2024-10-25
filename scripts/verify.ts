
import { run } from "hardhat";



export async function verify(address: string, constructorArguments: any[]) {

  try {

    await run("verify:verify", {

      address,

      constructorArguments,

    });

  } catch (error) {

    console.error(`Error verifying contract at ${address}:`, error);

  }

}
