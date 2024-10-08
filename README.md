# Fine Grained Authorization Trade-offs

This repository contains three possible trade-offs when considering fine-grained authorization that contains both conditions and relationships.

The three possible trade-offs that are demonstrated are:

- Coupling policy and enforcement
- Complex Access Control Rules
- Data manipulation

For more information on each and to learn more, refer to the following [blog post](https://www.permit.io/blog/possible-tradoffs-of-fine-grained-authorization)

## Project Structure

#### Data
The data that we are using to demonstrate the trade-offs are a set of visits with relationships with diagnoses and practitioners.
An allowed visit is a visit that is not concealed, its related diagnoses are not concealed, and its practitioner is advertised.

All the mock data is stored in the `data/data.json` file.
```js
// Visit
{
    "appointment_id": "123",
    "practitioner_id": "123456",
    "diagnosis": ["y4500"],
    "concealed": false
}

// Diagnosis
{
    "id": "y4500",
    "concealment": false
}

// Practitioner
{
    "practitioner_id": "123456",
    "is_advertised": true
}
```

#### Tests
The project's main test file is the `index.js` file, which contains four types of policy checks that require both conditions and relationships to be checked.

All the tests filter the visits array and should return the following result:
```javascript
[true, false, false, false, true, true]
```

The tests are:
1. Simple policy configuration with the trade-off of using complex enforcement code
2. Graph-based policy configuration with the trade-off of data manipulation and extra conditional edges and special nodes
3. Policy configuration with the trade-off of complex access control rules in the Rego language

##### Bonus test:
> Demonstration of a simple solution by Permit.io that solves the problem with a simple policy configuration and enforcement code

Each test starts by cleaning the data and some policies from the Permit.io environment. Then, it applies the relevant policy data and runs the test.

#### Policy Configuration
Besides the tests and the data, the project contains a `main.tf` file that applies the policy configuration to the Permit.io environment.

#### Policies
The `policy` folder contains policy configuration in the Rego language used in the third test.

### `lib` folder
The `lib` folder contains all the code used to sync data to Permit.io and perform the policy checks.

## Running the code

The code is written in JavaScript and uses Permit.io to base the authorization service. Running the project requires you to follow the following steps:

> Preqrequisites: Node.js, npm, terraform, and docker installed

1. Clone the repository
2. Run `npm install` to install the dependencies
3. Get your Permit.io API key from [here](https://app.permit.io/). (open a free account if you don't have one)
4. Copy the `.env.template` file to an `.env` file and add your Permit.io API key in the `PERMIT_API_KEY` and `TF_VAR_PERMIT_API_KEY`.
5. Apply the policy configuration to a clean environment in your Permit.io account by running:
   ```bash
   terraform init                                                                                                                                                                                  ✔  9s   12:57:07 
   terraform plan
   terraform apply
   ```
   After this step, your Permit policy editor should look like the following:
   ![image](https://github.com/user-attachments/assets/b9387368-0fb1-4ffa-9722-2b947ea5c1b8)

6. Run the Permit.io PDP docker container by running (ensure that you load the Permit.io API key in the environment):
   ```bash
   docker run -p 7766:7000 -p 8181:8181 --rm --env PDP_API_KEY=$PERMIT_API_KEY --env PDP_DEBUG=true permitio/pdp-v2:latest
   ```
6. Run the tests with the `node index` command.

The desired output should be:
```
Flat filter result:  [true,false,false,false,true,true]
Graph filter result:  [true,false,false,false,true,true]
Custom rego check result:  [true,false,false,false,true,true]
Single check result:  [true,false,false,false,true,true]
```
