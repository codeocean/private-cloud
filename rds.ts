import * as aws from "@pulumi/aws"

import * as config from "./config"
import * as secrets from "./secrets"
import * as vpc from "./vpc"

const rdsConf = config.services.aws.analyticsdb

const dbSubnets = new aws.rds.SubnetGroup("dbsubnets", {
    subnetIds: vpc.vpc.privateSubnetIds,
})

export const analytics = new aws.rds.Instance("analyticsdb", {
    allocatedStorage: 20,
    backupRetentionPeriod: 7,
    backupWindow: "05:18-05:48",
    dbSubnetGroupName: dbSubnets.name,
    engine: "postgres",
    engineVersion: "13.1",
    instanceClass: rdsConf.instanceClass,
    maxAllocatedStorage: 100,
    multiAz: rdsConf.multiAZ,
    password: secrets.analyticsdb.passsword.result,
    skipFinalSnapshot: true,
    tags: {
        Name: "codeocean-analytics-db",
        deployment: config.deploymentName,
    },
    username: "root",
    vpcSecurityGroupIds: [
        vpc.sgAnalyticsDB.id,
    ],
})
