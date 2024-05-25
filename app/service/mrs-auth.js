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

const crypto = require("crypto")
const url = `${process.env.MRS_URL}/${process.env.SERVICE}/authentication/login?app=MRS`

exports.login = async (username, password) => {
 
  const nonce = hex(crypto.getRandomValues(new Uint8Array(10)))
  const userBody = {
    user: username, 
    nonce: nonce
  }

  const userResp = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(userBody)
  })

  const userData = await userResp.json()
  const salt = new Uint8Array(userData.salt)
  const b64Salt = Buffer.from(salt).toString('base64')
  const iterations = userData.iterations
  const session = userData.session
  const clientFirst = `n=${username},r=${nonce}`
  const clientFinal = `r=${userData.nonce}`
  const serverFirst = `r=${userData.nonce},s=${b64Salt},i=${String(iterations)}`;

  const clientProof = Array.from(await calculateClientProof(
    password, 
    salt, 
    iterations, 
    clientFirst,
    serverFirst,
    clientFinal))

  const tokenUrl = `${url}&sessionType=bearer&session=${session}`
  const sessionBody = {
    clientProof: clientProof,
    nonce: userData.nonce,
    state: "response"
  }

  const passResp = await fetch(tokenUrl, {
      method: 'POST',
      body: JSON.stringify(sessionBody)
  })
  return await passResp.json()
}

hex = (arrayBuffer) => {

  let retVal = Array.from(new Uint8Array(arrayBuffer))
      .map((n) => { return n.toString(16).padStart(2, "0"); })
      .join("");
  return retVal
}

calculateClientProof = async (
  password, 
  salt, 
  iterations, 
  clientFirst,
  serverFirst,
  clientFinal) => {

  const te = new TextEncoder();
  const authMessage = `${clientFirst},${serverFirst},${clientFinal}`;
  const encodedAuthMessage = te.encode(authMessage)
  const saltedPassword = await calculatePbkdf2(te.encode(password), salt, iterations)
  const clientKey = await calculateHmac(saltedPassword, te.encode('Client Key'))
  const storedKey = await calculateSha256(clientKey)
  const clientSignature = await calculateHmac(storedKey, encodedAuthMessage);
  const clientProof = calculateXor(clientSignature, clientKey);
  return clientProof;
}

calculatePbkdf2 = async (password, salt, iterations) => {

  const ck1 = await crypto.subtle.importKey("raw", password, { name: "PBKDF2" }, false, ["deriveKey", "deriveBits"])
  const result = new Uint8Array(await crypto.subtle.deriveBits(
    { 
      name: "PBKDF2", 
      hash: "SHA-256", 
      salt, 
      iterations 
    }, ck1, 256))

  return result
}

calculateHmac = async (secret, data) => {

  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: { name: "SHA-256" } }, true, ["sign", "verify"])
  const signature = await crypto.subtle.sign("HMAC", key, data)
  return new Uint8Array(signature)
}

calculateSha256 = async (data) => {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data))
}

calculateXor = (a1, a2) => {
  const l1 = a1.length;
  const l2 = a2.length;
  // cSpell:ignore amax
  let amax;
  let amin;
  let loop;

  if (l1 > l2) {
      amax = new Uint8Array(a1);
      amin = a2;
      loop = l2;
  } else {
      amax = new Uint8Array(a2);
      amin = a1;
      loop = l1;
  }

  for (let i = 0; i < loop; ++i) {
      amax[i] ^= amin[i];
  }

  return amax;
}

