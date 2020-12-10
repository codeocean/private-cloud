import * as aws from "@pulumi/aws"

import * as config from "./config"

export const alarmsTopic = new aws.sns.Topic("alarms", {
    tags: {
        deployment: config.deploymentName,
    },
})
