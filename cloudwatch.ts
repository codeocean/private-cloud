import * as aws from "@pulumi/aws"

import * as asg from "./asg"
import * as config from "./config"
import * as ec2 from "./ec2"
import * as lb from "./lb"
import * as sns from "./sns"

// Scale out so we have machine with the maximum amount of slots we make a available for a single run
// we could do better by scaling out only when large runs come in, but the current architecture doesn't
// keep pending runs backend side (Either in DB or Queue).
new aws.cloudwatch.MetricAlarm("workers-available-slots-low", {
    alarmActions: [asg.workersAvailableSlotsScaleOutPolicy.arn],
    alarmDescription: "Workers available slots are low",
    comparisonOperator: "LessThanThreshold",
    datapointsToAlarm: 6,
    dimensions: {
        AutoScalingGroupName: asg.workersAsg.name,
    },
    evaluationPeriods: 6,
    metricName: "AvailableSlots",
    namespace: "CodeOcean",
    period: 10,
    statistic: "Maximum",
    threshold: 16, // TODO This changes dependening on the slots available in each worker
    tags: {
        deployment: config.deploymentName,
    },
})

// Scale in so we have a maximum of 1 excess machine
new aws.cloudwatch.MetricAlarm("workers-available-slots-high", {
    alarmActions: [asg.workersAvailableSlotsScaleInPolicy.arn],
    alarmDescription: "Workers available slots are high",
    comparisonOperator: "GreaterThanOrEqualToThreshold",
    datapointsToAlarm: 6,
    dimensions: {
        AutoScalingGroupName: asg.workersAsg.name,
    },
    evaluationPeriods: 6,
    metricName: "AvailableSlots",
    namespace: "CodeOcean",
    period: 10,
    statistic: "Sum",
    threshold: 320, // TODO This changes dependening on the slots available in each worker
    tags: {
        deployment: config.deploymentName,
    },
})

interface VolumeHighUsageAlarmArgs {
    minutesToAlarm: number
    path: string
    threshold: number
    volumeName: string
}

// Services machine alarms

function servicesVolumeHighUsageAlarm(args: VolumeHighUsageAlarmArgs) {
    new aws.cloudwatch.MetricAlarm(`services-${args.volumeName}-volume-usage-high`, {
        alarmActions: [sns.alarmsTopic],
        alarmDescription: `Services machine ${args.volumeName} volume usage is high`,
        comparisonOperator: "GreaterThanThreshold",
        datapointsToAlarm: args.minutesToAlarm,
        dimensions: {
            InstanceId: ec2.servicesInstance.id,
            path: args.path,
        },
        evaluationPeriods: args.minutesToAlarm,
        metricName: "disk_used_percent",
        namespace: "CWAgent",
        okActions: [sns.alarmsTopic],
        period: 60,
        statistic: "Maximum",
        threshold: args.threshold,
        tags: {
            deployment: config.deploymentName,
        },
    })
}

servicesVolumeHighUsageAlarm({
    minutesToAlarm: 30,
    path: "/",
    threshold: 90,
    volumeName: "root",
})
servicesVolumeHighUsageAlarm({
    minutesToAlarm: 10,
    path: "/data",
    threshold: 70,
    volumeName: "data",
})
servicesVolumeHighUsageAlarm({
    minutesToAlarm: 30,
    path: "/docker",
    threshold: 90,
    volumeName: "docker",
})

new aws.cloudwatch.MetricAlarm("services-cpu-usage-high", {
    alarmActions: [sns.alarmsTopic],
    alarmDescription: "Services machine CPU usage is high",
    comparisonOperator: "GreaterThanThreshold",
    datapointsToAlarm: 6,
    dimensions: {
        InstanceId: ec2.servicesInstance.id,
    },
    evaluationPeriods: 6,
    metricName: "CPUUtilization",
    namespace: "AWS/EC2",
    okActions: [sns.alarmsTopic],
    period: 300,
    statistic: "Average",
    threshold: 70,
    tags: {
        deployment: config.deploymentName,
    },
})

new aws.cloudwatch.MetricAlarm("services-memory-usage-high", {
    alarmActions: [sns.alarmsTopic],
    alarmDescription: "Services machine memory usage is high",
    comparisonOperator: "GreaterThanThreshold",
    datapointsToAlarm: 6,
    dimensions: {
        InstanceId: ec2.servicesInstance.id,
    },
    evaluationPeriods: 6,
    metricName: "mem_used_percent",
    namespace: "CWAgent",
    okActions: [sns.alarmsTopic],
    period: 300,
    statistic: "Average",
    threshold: 80,
    tags: {
        deployment: config.deploymentName,
    },
})

// System up alarm.
// We use the web target group as an indicator for the entire services host.
new aws.cloudwatch.MetricAlarm("services-unhealthy-host", {
    alarmActions: [sns.alarmsTopic],
    alarmDescription: "Services machine is not responding to load balancer health checks",
    comparisonOperator: "GreaterThanThreshold",
    datapointsToAlarm: 1,
    dimensions: {
        LoadBalancer: lb.externalAlb.arnSuffix,
        TargetGroup: lb.webTargetGroup.arnSuffix,
    },
    evaluationPeriods: 1,
    metricName: "UnHealthyHostCount",
    namespace: "AWS/ApplicationELB",
    okActions: [sns.alarmsTopic],
    period: 60,
    statistic: "Maximum",
    threshold: 0,
    tags: {
        deployment: config.deploymentName,
    },
})

// Elevated error rate
new aws.cloudwatch.MetricAlarm("services-elevated-error-rate", {
    alarmActions: [sns.alarmsTopic],
    alarmDescription: "Spike detected in 5xx errors returned by the services machine",
    comparisonOperator: "GreaterThanOrEqualToThreshold",
    evaluationPeriods: 2,
    okActions: [sns.alarmsTopic],
    threshold: 10,

    metricQueries: [{
        expression: "(m2+m3)/m1*100",
        id: "e1",
        label: "5xx Error Rate",
        returnData: true,
    }, {
        id: "m1",
        metric: {
            dimensions: {
                LoadBalancer: lb.externalAlb.arnSuffix,
            },
            metricName: "RequestCount",
            namespace: "AWS/ApplicationELB",
            period: 120,
            stat: "Sum",
            unit: "Count",
        },
    }, {
        id: "m2",
        metric: {
            dimensions: {
                LoadBalancer: lb.externalAlb.arnSuffix,
            },
            metricName: "HTTPCode_ELB_5XX_Count",
            namespace: "AWS/ApplicationELB",
            period: 120,
            stat: "Sum",
            unit: "Count",
        },
    }, {
        id: "m3",
        metric: {
            dimensions: {
                LoadBalancer: lb.externalAlb.arnSuffix,
            },
            metricName: "HTTPCode_Target_5XX_Count",
            namespace: "AWS/ApplicationELB",
            period: 120,
            stat: "Sum",
            unit: "Count",
        },
    }],
    tags: {
        deployment: config.deploymentName,
    },
})

// Workers alarms

function workersVolumeHighUsageAlarm(args: VolumeHighUsageAlarmArgs) {
    new aws.cloudwatch.MetricAlarm(`workers-${args.volumeName}-volume-usage-high`, {
        alarmActions: [sns.alarmsTopic],
        alarmDescription: `Worker machine ${args.volumeName} volume usage is high`,
        comparisonOperator: "GreaterThanThreshold",
        datapointsToAlarm: args.minutesToAlarm,
        dimensions: {
            AutoScalingGroupName: asg.workersAsg.name,
            path: args.path,
        },
        evaluationPeriods: args.minutesToAlarm,
        metricName: "disk_used_percent",
        namespace: "CWAgent",
        okActions: [sns.alarmsTopic],
        period: 60,
        statistic: "Maximum",
        threshold: args.threshold,
        tags: {
            deployment: config.deploymentName,
        },
    })
}

workersVolumeHighUsageAlarm({
    minutesToAlarm: 30,
    path: "/",
    threshold: 90,
    volumeName: "root",
})
workersVolumeHighUsageAlarm({
    minutesToAlarm: 10,
    path: "/docker",
    threshold: 90,
    volumeName: "docker",
})
workersVolumeHighUsageAlarm({
    minutesToAlarm: 10,
    path: "/worker",
    threshold: 90,
    volumeName: "worker",
})
