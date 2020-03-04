import * as aws from "@pulumi/aws"
import * as asg from "./asg"

new aws.cloudwatch.MetricAlarm("workers-slots-utilization-high", {
    alarmActions: [asg.workersUtilizationScaleOutPolicy.arn],
    alarmDescription: "Workers slots utilization is high",
    comparisonOperator: "GreaterThanThreshold",
    datapointsToAlarm: 1,
    dimensions: {
        "AutoScalingGroupName": asg.workersAsg.name,
    },
    evaluationPeriods: 1,
    metricName: "SlotsUtilization",
    namespace: "CodeOcean",
    period: 10,
    statistic: "Average",
    threshold: 80,
})

new aws.cloudwatch.MetricAlarm("workers-slots-utilization-low", {
    alarmActions: [asg.workersUtilizationScaleInPolicy.arn],
    alarmDescription: "Workers slots utilization is low",
    comparisonOperator: "LessThanThreshold",
    datapointsToAlarm: 15,
    dimensions: {
        "AutoScalingGroupName": asg.workersAsg.name,
    },
    evaluationPeriods: 15,
    metricName: "SlotsUtilization",
    namespace: "CodeOcean",
    period: 60,
    statistic: "Average",
    threshold: 50,
})

// Scale out so we have machine with the maximum amount of slots we make a available for a single run
// we could do better by scaling out only when large runs come in, but the current architecture doesn't
// keep pending runs backend side (Either in DB or Queue).
new aws.cloudwatch.MetricAlarm("workers-available-slots-low", {
    alarmActions: [asg.workersAvailableSlotsScaleOutPolicy.arn],
    alarmDescription: "Workers available slots are low",
    comparisonOperator: "LessThanThreshold",
    datapointsToAlarm: 6,
    dimensions: {
        "AutoScalingGroupName": asg.workersAsg.name,
    },
    evaluationPeriods: 6,
    metricName: "AvailableSlots",
    namespace: "CodeOcean",
    period: 10,
    statistic: "Maximum",
    threshold: 16, // TODO This changes dependening on the slots available in each worker
})
