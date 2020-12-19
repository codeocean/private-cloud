import * as AWS from "aws-sdk"

import * as config from "./config"
import * as ec2 from "./ec2"
import { delay, Migration } from "./migration"
import { Provisioner } from "./provisioner"
import * as ssm from "./ssm"

// InitSystemData runs Code Ocean system data initialization after each deployments.
export const InitSystemData = new Provisioner<config.AMIConfig, never>("init-system-data-provisioner", {
    dep: config.ami,
    onCreate: runInitSystemData,
    changeToken: "",
}, {
    dependsOn: [
        ec2.servicesInstance,
        Migration,
        ssm.runInitSystemDataDocument,
    ],
})

function runInitSystemData(): Promise<never> {
    return new Promise((resolve, reject) => {
        const runInitSystemDataDocumentName = ssm.runInitSystemDataDocument.name.get()
        const servicesInstanceId = ec2.servicesInstance.id.get()
        const ssmClient = new AWS.SSM()

        ssmClient.sendCommand({
            DocumentName: runInitSystemDataDocumentName,
            InstanceIds: [servicesInstanceId],
        }).promise().then(response => delay(3000).then(() => ssmClient.waitFor("commandExecuted", {
            CommandId: response.Command!.CommandId!,
            InstanceId: servicesInstanceId,
            $waiter: {
                delay: 5,
                maxAttempts: 60,
            },
        }).promise().then(response => {
            if (response.Status != "Success") {
                throw new Error(`Init system data failed with status '${response.Status}'`)
            }
            resolve()
        }))).catch(reject)
    })
}
