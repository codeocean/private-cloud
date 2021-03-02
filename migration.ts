import * as AWS from "aws-sdk"

import * as config from "./config"
import * as ec2 from "./ec2"
import { Provisioner } from "./provisioner"
import * as ssm from "./ssm"

// Migration runs Code Ocean data migrations when system version changes.
export const Migration = new Provisioner<string, never>("migration-provisioner", {
    dep: config.version.version,
    onCreate: runMigration,
    changeToken: "",
}, {
    dependsOn: [
        ec2.servicesInstance,
        ec2.servicesDataVolume,
        ssm.runMigrationDocument,
    ],
})

export const delay = (t: number) => new Promise(resolve => setTimeout(resolve, t))

function waitForSsmConnection(servicesInstanceId: string, ssmClient: AWS.SSM, callback: any): void {
    var params = {
        Target: servicesInstanceId,
    }
    ssmClient.getConnectionStatus(params, function(err, data) {
        if (err || data.Status !== "connected") {
            waitForSsmConnection(servicesInstanceId, ssmClient, callback)
        } else {
            callback()
        }
    })
}

function runMigration(): Promise<never> {
    return new Promise((resolve, reject) => {
        const runMigrationDocumentName = ssm.runMigrationDocument.name.get()
        const servicesInstanceId = ec2.servicesInstance.id.get()
        const ssmClient = new AWS.SSM({region: config.aws.region})

        waitForSsmConnection(servicesInstanceId, ssmClient, () => {
            ssmClient.sendCommand({
                DocumentName: runMigrationDocumentName,
                InstanceIds: [servicesInstanceId],
                Parameters: {
                    "dryRun": ["false"],
                },
            }).promise().then(response => delay(3000).then(() => ssmClient.waitFor("commandExecuted", {
                CommandId: response.Command!.CommandId!,
                InstanceId: servicesInstanceId,
                $waiter: {
                    delay: 5,
                    maxAttempts: 60,
                },
            }).promise().then(response => {
                if (response.Status != "Success") {
                    throw new Error(`Migration failed with status '${response.Status}'`)
                }
                resolve()
            }))).catch(reject)
        })
    })
}
