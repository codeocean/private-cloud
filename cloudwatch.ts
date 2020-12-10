import * as fs from "fs"

import * as aws from "@pulumi/aws"
import * as pulumi from "@pulumi/pulumi"
import * as AWS from "aws-sdk"
import * as handlebars from "handlebars"

import * as asg from "./asg"
import * as config from "./config"
import * as ebs from "./ebs"
import * as ec2 from "./ec2"
import * as lb from "./lb"
import * as slots from "./slots"
import * as sns from "./sns"

const getLogGroupNames = new AWS.CloudWatchLogs().describeLogGroups({
    logGroupNamePrefix: `/codeocean/${config.stackname}/`,
}).promise().then(v => v.logGroups?.map(v => v.logGroupName))

async function getLogGroupOpts(logGroupSuffix: string): Promise<pulumi.CustomResourceOptions | undefined> {
    const logGroupNames = await getLogGroupNames

    if (logGroupNames?.includes(`/codeocean/${config.stackname}/${logGroupSuffix}`)) {
        return {
            import: `/codeocean/${config.stackname}/${logGroupSuffix}`,
            ignoreChanges: ["tags", "retentionInDays"],
        }
    }

    return undefined
}

export const instancesLogGroup = getLogGroupOpts("instances").then(opts => {
    return new aws.cloudwatch.LogGroup("instances", {
        name: `/codeocean/${config.stackname}/instances`,
        retentionInDays: 30,
        tags: {
            deployment: config.deploymentName,
        },
    }, opts)
})

export const servicesLogGroup = getLogGroupOpts("services").then(opts => {
    return new aws.cloudwatch.LogGroup("services", {
        name: `/codeocean/${config.stackname}/services`,
        retentionInDays: 30,
        tags: {
            deployment: config.deploymentName,
        },
    }, opts)
})

export const workersLogGroup = getLogGroupOpts("workers").then(opts => {
    return new aws.cloudwatch.LogGroup("workers", {
        name: `/codeocean/${config.stackname}/workers`,
        retentionInDays: 30,
        tags: {
            deployment: config.deploymentName,
        },
    }, opts)
})

if (!config.workers.general.maintainIdleWorker) {
    // Scale out when all computation run requests in an evaluation period fail with an overloaded status
    new aws.cloudwatch.MetricAlarm("workers-available-slots-low", {
        alarmActions: [asg.workersAvailableSlotsScaleOutPolicy.arn],
        alarmDescription: "No workers available to execute a computation task",
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        datapointsToAlarm: 1,
        dimensions: {
            "InstanceID": ec2.servicesInstance.id,
            "MachineType": "0",
        },
        evaluationPeriods: 1,
        metricName: "OverloadStatus",
        namespace: "CodeOcean",
        period: 10,
        statistic: "Minimum",
        tags: {
            deployment: config.deploymentName,
        },
        threshold: 1,
    })

    // Scale in whenever a worker is idle
    new aws.cloudwatch.MetricAlarm("workers-slot-utilization-low", {
        alarmActions: [asg.workersAvailableSlotsScaleInPolicy.arn],
        alarmDescription: "Workers slot utilization is low",
        comparisonOperator: "LessThanOrEqualToThreshold",
        datapointsToAlarm: config.workers.general.autoScalingIdleTimeout,
        dimensions: {
            AutoScalingGroupName: asg.workersAsg.name,
        },
        evaluationPeriods: config.workers.general.autoScalingIdleTimeout,
        metricName: "SlotsUtilization",
        namespace: "CodeOcean",
        period: 60,
        statistic: "Minimum",
        threshold: 0,
        tags: {
            deployment: config.deploymentName,
        },
        treatMissingData: "notBreaching",
    })
} else {
    // Scale out so we have machine with the maximum amount of slots we make a available for a single run
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
        threshold: slots.config.general.slotsPerWorker,
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
        threshold: pulumi.output(slots.config.general.slotsPerWorker).apply(v => v * 2 * 10),
        tags: {
            deployment: config.deploymentName,
        },
    })
}

if (!config.workers.gpu.maintainIdleWorker) {
    // Scale out when all computation run requests in an evaluation period fail with an overloaded status
    new aws.cloudwatch.MetricAlarm("workers-gpu-available-slots-low", {
        alarmActions: [asg.workersGpuAvailableSlotsScaleOutPolicy.arn],
        alarmDescription: "No gpu workers available to execute a computation task",
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        datapointsToAlarm: 1,
        dimensions: {
            "InstanceID": ec2.servicesInstance.id,
            "MachineType": "1",
        },
        evaluationPeriods: 1,
        metricName: "OverloadStatus",
        namespace: "CodeOcean",
        period: 10,
        statistic: "Minimum",
        tags: {
            deployment: config.deploymentName,
        },
        threshold: 1,
    })

    // Scale in whenever a worker is idle
    new aws.cloudwatch.MetricAlarm("workers-gpu-slot-utilization-low", {
        alarmActions: [asg.workersGpuAvailableSlotsScaleInPolicy.arn],
        alarmDescription: "Workers gpu slot utilization is low",
        comparisonOperator: "LessThanOrEqualToThreshold",
        datapointsToAlarm: config.workers.gpu.autoScalingIdleTimeout,
        dimensions: {
            AutoScalingGroupName: asg.workersGpuAsg.name,
        },
        evaluationPeriods: config.workers.gpu.autoScalingIdleTimeout,
        metricName: "SlotsUtilization",
        namespace: "CodeOcean",
        period: 60,
        statistic: "Minimum",
        threshold: 0,
        tags: {
            deployment: config.deploymentName,
        },
        treatMissingData: "notBreaching",
    })
} else {
    // Scale out so we have machine with the maximum amount of slots we make a available for a single run
    new aws.cloudwatch.MetricAlarm("workers-gpu-available-slots-low", {
        alarmActions: [asg.workersGpuAvailableSlotsScaleOutPolicy.arn],
        alarmDescription: "Workers gpu available slots are low",
        comparisonOperator: "LessThanThreshold",
        datapointsToAlarm: 6,
        dimensions: {
            AutoScalingGroupName: asg.workersGpuAsg.name,
        },
        evaluationPeriods: 6,
        metricName: "AvailableSlots",
        namespace: "CodeOcean",
        period: 10,
        statistic: "Maximum",
        threshold: slots.config.general.slotsPerWorker,
        tags: {
            deployment: config.deploymentName,
        },
    })

    // Scale in so we have a maximum of 1 excess machine
    new aws.cloudwatch.MetricAlarm("workers-gpu-available-slots-high", {
        alarmActions: [asg.workersGpuAvailableSlotsScaleInPolicy.arn],
        alarmDescription: "Workers gpu available slots are high",
        comparisonOperator: "GreaterThanOrEqualToThreshold",
        datapointsToAlarm: 6,
        dimensions: {
            AutoScalingGroupName: asg.workersGpuAsg.name,
        },
        evaluationPeriods: 6,
        metricName: "AvailableSlots",
        namespace: "CodeOcean",
        period: 10,
        statistic: "Sum",
        threshold: pulumi.output(slots.config.gpu.slotsPerWorker).apply(v => v * 2 * 10),
        tags: {
            deployment: config.deploymentName,
        },
    })
}

interface VolumeUsageAlarmArgs {
    minutesToAlarm: number
    path: string
    threshold: number
    volumeName: string
}

// Services machine alarms

function servicesVolumeHighUsageAlarm(args: VolumeUsageAlarmArgs) {
    new aws.cloudwatch.MetricAlarm(`services-${args.volumeName}-volume-usage-${args.threshold}`, {
        alarmActions: [sns.alarmsTopic],
        alarmDescription: `Services machine ${args.volumeName} volume usage is more than ${args.threshold}`,
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
    minutesToAlarm: 10,
    path: "/data",
    threshold: 95,
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

// Internal Server Errors
new aws.cloudwatch.LogMetricFilter("services-500", {
    logGroupName: pulumi.output(servicesLogGroup).apply(v => v.name),
    pattern: "[date, time, service, level, source=GIN, status=500, ...]",
    metricTransformation: {
        namespace: "CodeOcean",
        value: "1",
        name: "Services_HTTP_500_LogCount",
    },
})

new aws.cloudwatch.LogMetricFilter("workers-500", {
    logGroupName: pulumi.output(workersLogGroup).apply(v => v.name),
    pattern: "[date, time, service, level, source=GIN, status=500, ...]",
    metricTransformation: {
        namespace: "CodeOcean",
        value: "1",
        name: "Workers_HTTP_500_LogCount",
    },
})

new aws.cloudwatch.MetricAlarm("internal-server-errors", {
    alarmActions: [sns.alarmsTopic],
    alarmDescription: "Internal server errors returned by CodeOcean services",
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    okActions: [sns.alarmsTopic],
    threshold: 0,
    metricQueries: [{
        expression: "(m1+m2)",
        id: "e1",
        label: "500 Error Count",
        returnData: true,
    }, {
        id: "m1",
        metric: {
            metricName: "Services_HTTP_500_LogCount",
            namespace: "CodeOcean",
            period: 60,
            stat: "Sum",
        },
    }, {
        id: "m2",
        metric: {
            metricName: "Workers_HTTP_500_LogCount",
            namespace: "CodeOcean",
            period: 60,
            stat: "Sum",
        },
    }],
    tags: {
        deployment: config.deploymentName,
    },
})

// Workers alarms

function workersVolumeHighUsageAlarm(args: VolumeUsageAlarmArgs) {
    new aws.cloudwatch.MetricAlarm(`workers-${args.volumeName}-volume-usage-${args.threshold}`, {
        alarmActions: [sns.alarmsTopic],
        alarmDescription: `Worker machine ${args.volumeName} volume usage is more than ${args.threshold}`,
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

new aws.cloudwatch.Dashboard("codeocean-dashboard", {
    dashboardName: `codeocean-${config.stackname}`,
    dashboardBody: pulumi.all([
        ebs.dataVolume.id,
        config.aws.region,
    ]).apply(([
        dataVolumeId,
        awsRegion,
    ]) => {
        const template = handlebars.compile(fs.readFileSync("ebs-dashboard.json", "utf8"))
        return template({
            dataVolumeId,
            awsRegion,
        })
    }),
})
