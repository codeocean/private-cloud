import * as aws from "@pulumi/aws"

import * as config from "./config"
import * as ebs from "./ebs"
import * as iam from "./iam"

const backupVault = new aws.backup.Vault("codeocean", {
    tags: {
        deployment: config.deploymentName,
    },
})

const backupPlan = new aws.backup.Plan("daily",{
    rules: [
        {
            ruleName: "daily",
            targetVaultName: backupVault.name,
            schedule: "cron(0 0 ? * * *)",
            lifecycle: {
                deleteAfter: 14,
            }
        },
    ],
    tags: {
        deployment: config.deploymentName,
    },
})

new aws.backup.Selection("data", {
    resources: [ebs.dataVolume.arn],
    iamRoleArn: iam.awsBackupDefaultServiceRole.arn,
    planId: backupPlan.id,
})
