#!/usr/bin/env python3

#
# import subprocess
#
# def run_command(command):
#     """ Run a system command. """
#     try:
#         result = subprocess.run(command, check=True, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
#         print(f"Output:\n{result.stdout}")
#     except subprocess.CalledProcessError as e:
#         print(f"Error running command '{command}':\n{e.stderr}")
#
# def main():
#     # Replace these commands with the ones you need
#     commands = ["echo 'hello'",
#                 "npx hardhat deploy-programmable-token-transfers",
#                 "npx hardhat deploy-programmable-token-transfers --network polygonMumbai"]
#
#     for cmd in commands:
#         print(f"Running command: {cmd}")
#         run_command(cmd)
#
# if __name__ == "__main__":
#     main()



import subprocess
import os
import pty

def run_command(command):
    """ Run a system command in a pseudo-terminal. """
    master, slave = pty.openpty()
    try:
        result = subprocess.run(command, check=True, shell=True, stdout=slave, stderr=slave, text=True)
        os.close(slave)
        output = os.read(master, 1024).decode('utf-8')
        print(f"Output:\n{output}")
        print(f'result: f{result}')
    except subprocess.CalledProcessError as e:
        os.close(slave)
        print(f"Error running command: '{command}':\n{e.stderr}")
        print(e)
def main():
    commands = [
                "npx hardhat deploy-programmable-token-transfers",
                # "npx hardhat deploy-programmable-token-transfers --network polygonMumbai", // was not working --RPC errors?
                "npx hardhat deploy-programmable-token-transfers --network avalancheFuji",
                "npx hardhat deploy-programmable-token-transfers --network ethereumSepolia"
               ]
    for cmd in commands:
        print(f"Running command: {cmd}")
        run_command(cmd)

if __name__ == "__main__":
    main()