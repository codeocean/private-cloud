import * as pulumi from "@pulumi/pulumi"
import * as AWS from "aws-sdk"

import * as pulumiConfig from "./config"

const workerReservedMemoryMB = 1024

interface ResourceClass {
    readonly id: string
    readonly description: string
    readonly name: string
    readonly order: number
    readonly resource: {
        readonly slots: number
    }
}

interface Slot {
    readonly cpu: number
    readonly memory: number
}

export interface SlotConfig {
    readonly classes: ResourceClass[]
    readonly defaultClass: string
    readonly slot: Slot
    readonly workerReservedMemoryMB: number
}

const idNamesArray = [
    { id: "xsmall", name: "X-Small", slots: 1 },
    { id: "small", name: "Small", slots: 2 },
    { id: "2xsmall", name: "2x Small", slots: 4 },
    { id: "medium", name: "Medium", slots: 8 },
    { id: "large", name: "Large", slots: 16 },
    { id: "2xlarge", name: "2x Large", slots: 32 },
    { id: "3xlarge", name: "3x Large", slots: 48 },
    { id: "4xlarge", name: "4x Large", slots: 64 },
    { id: "5xlarge", name: "5x Large", slots: 72 },
    { id: "6xlarge", name: "6x Large", slots: 96 },
]

export const config = pulumi.output<SlotConfig>(new AWS.EC2({apiVersion: "2016-11-15"}).describeInstanceTypes({
    InstanceTypes: [pulumiConfig.workers.instanceType],
}).promise().then((data) => {
    if ((!(data.InstanceTypes)) || (data.InstanceTypes!.length == 0)) {
        throw new pulumi.RunError(`Could not get worker instance type from AWS: ${pulumiConfig.workers.instanceType}`)
    }

    let instanceType = data.InstanceTypes![0]
    let slotsPerWorker = instanceType.VCpuInfo!.DefaultVCpus
    const slot: Slot = {
        cpu: 1,
        memory: ((instanceType.MemoryInfo!.SizeInMiB! - workerReservedMemoryMB) / slotsPerWorker!) * 1000 * 1000,
    }

    let classes : ResourceClass[] = idNamesArray.filter(v => v.slots <= slotsPerWorker!).map((v, _i) => {
        return {
            id: v.id,
            description: `${v.slots} cores / ${Math.round(slot.memory / 1000 / 1000 / 1000) * v.slots} GB RAM`,
            name: v.name,
            order: _i + 1,
            resource: {
                slots: v.slots
            }
        }
    })

    return {
        classes,
        defaultClass: classes[0].id,
        slot,
        workerReservedMemoryMB: workerReservedMemoryMB
    }
}).catch((reason) => {
    throw new pulumi.RunError(`Could not get worker instance type from AWS: ${reason}`)
}))
