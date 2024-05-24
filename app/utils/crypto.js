// ============================================================================
//  Copyright 2023 Northern Pacific Technologies, LLC
// 
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//  
//     http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ============================================================================

verifyUserName = async (authApp, userName) => {
    this.authApp = authApp;

    const nonce = this.hex(crypto.getRandomValues(new Uint8Array(10)));

    await (await this.doFetch({
        input: `${this.authPath}/login?app=${authApp}`,
        method: "POST",
        body: {
            user: userName,
            nonce,
        },
    })).json();

    // Convert the salt to and Uint8Array
    challenge.salt = new Uint8Array(challenge.salt);

    this.loginState = {
        clientFirst: `n=${userName},r=${nonce}`,
        clientFinal: `r=${challenge.nonce}`,
        serverFirst: this.buildServerFirst(challenge),
        challenge,
        loginError: undefined,
    }
}

verifyPassword = async (password) => {
    const { challenge, clientFirst, serverFirst, clientFinal } = this.loginState;

    if (password !== undefined && password !== "" && this.authApp !== undefined &&
        clientFirst !== undefined && serverFirst !== undefined && challenge !== undefined &&
        clientFinal !== undefined) {
        const te = new TextEncoder();
        const authMessage = `${clientFirst},${serverFirst},${clientFinal}`;
        const clientProof = Array.from(await this.calculateClientProof(
            password, challenge.salt, challenge.iterations, te.encode(authMessage)));

        try {
            const response = await this.doFetch({
                input: `${this.authPath}/login?app=${this.authApp}&sessionType=bearer` +
                    (challenge.session !== undefined ? "&session=" + challenge.session : ""),
                method: "POST",
                body: {
                    clientProof,
                    nonce: challenge.nonce,
                    state: "response",
                },
            }, undefined, undefined, undefined, false);

            if (!response.ok) {
                this.accessToken = undefined;

                return {
                    authApp: this.authApp,
                    errorCode: response.status,
                    errorMessage: (response.status === 401)
                        ? "The sign in failed. Please check your username and password."
                        : `The sign in failed. Error code: ${String(response.status)}`,
                };
            } else {
                const result = await response.json();

                this.accessToken = String(result.accessToken);

                return {
                    authApp: this.authApp,
                    jwt: this.accessToken,
                };
            }
        } catch (e) {
            return {
                authApp: this.authApp,
                errorCode: 2,
                errorMessage: `The sign in failed. Server Error: ${String(e)}`,
            };
        }
    } else {
        return {
            authApp: this.authApp,
            errorCode: 1,
            errorMessage: `No password given.`,
        };
    }
}


