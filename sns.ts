import * as aws from "@pulumi/aws"

export const alarmsTopic = new aws.sns.Topic("alarms")
