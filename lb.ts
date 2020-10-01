import * as aws from "@pulumi/aws"

import * as acm from "./acm"
import * as config from "./config"
import * as ec2 from "./ec2"
import * as s3 from "./s3"
import * as vpc from "./vpc"

// External ALB

export const externalAlb = new aws.lb.LoadBalancer("external", {
    accessLogs: {
        bucket: s3.accessLogsBucket.bucket,
        enabled: true,
        prefix: "load-balacing",
    },
    enableHttp2: false,
    idleTimeout: 4000,
    securityGroups: [vpc.sgExternal.id],
    subnets: vpc.vpc.publicSubnetIds,
    tags: {
        deployment: config.deploymentName,
    },
}, {
    dependsOn: s3.accessLogsBucketPolicy,
})

export const webTargetGroup = new aws.lb.TargetGroup("web", {
    healthCheck: {
        path: "/health",
    },
    port: 8001,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
    tags: {
        deployment: config.deploymentName,
    },
})

const gwTargetGroup = new aws.lb.TargetGroup("gw", {
    healthCheck: {
        path: "/api/health",
    },
    port: 8080,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
    tags: {
        deployment: config.deploymentName,
    },
})

const fileProxyTargetGroup = new aws.lb.TargetGroup("file-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 8504,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
    tags: {
        deployment: config.deploymentName,
    },
})

const cwProxyTargetGroup = new aws.lb.TargetGroup("cw-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 8114,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
    tags: {
        deployment: config.deploymentName,
    },
})

const gitProxyTargetGroup = new aws.lb.TargetGroup("git-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 3050,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
    tags: {
        deployment: config.deploymentName,
    },
})

const s3ProxyTargetGroup = new aws.lb.TargetGroup("s3-proxy", {
    healthCheck: {
        path: "/health",
    },
    port: 7090,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
    tags: {
        deployment: config.deploymentName,
    },
})

new aws.lb.Listener("external-http", {
    defaultActions: [{
        redirect: {
            port: "443",
            protocol: "HTTPS",
            statusCode: "HTTP_301",
        },
        type: "redirect",
    }],
    loadBalancerArn: externalAlb.arn,
    port: 80,
    protocol: "HTTP",
})

const listener = new aws.lb.Listener("external-https", {
    certificateArn: acm.sslCert.arn,
    defaultActions: [{
        type: "forward",
        targetGroupArn: webTargetGroup.arn,
    }],
    loadBalancerArn: externalAlb.arn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
})

new aws.lb.ListenerRule("file-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/files/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: 100,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("file-proxy-auth-callback", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/files_auth_callback"],
        },
    }],
    listenerArn: listener.arn,
    priority: 200,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("file-proxy-datasets", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/datasets/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: 300,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("file-proxy-datasets-auth-callback", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/datasets_auth_callback"],
        },
    }],
    listenerArn: listener.arn,
    priority: 400,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("file-proxy-input", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/input/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: 500,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("file-proxy-input-auth-callback", {
    actions: [{
        type: "forward",
        targetGroupArn: fileProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/input_auth_callback"],
        },
    }],
    listenerArn: listener.arn,
    priority: 600,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("git-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: gitProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/capsule-*.git/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: 700,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("cw-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: cwProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/cw/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: 800,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("gw", {
    actions: [{
        type: "forward",
        targetGroupArn: gwTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/api/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: 900,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.ListenerRule("s3-proxy", {
    actions: [{
        type: "forward",
        targetGroupArn: s3ProxyTargetGroup.arn,
    }],
    conditions: [{
        pathPattern: {
            values: ["/s3/*"],
        },
    }],
    listenerArn: listener.arn,
    priority: 1000,
}, {
    deleteBeforeReplace: true,
})

new aws.lb.TargetGroupAttachment("s3-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: s3ProxyTargetGroup.arn,
})

new aws.lb.TargetGroupAttachment("git-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: gitProxyTargetGroup.arn,
})

new aws.lb.TargetGroupAttachment("cw-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: cwProxyTargetGroup.arn,
})

new aws.lb.TargetGroupAttachment("file-proxy", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: fileProxyTargetGroup.arn,
})

new aws.lb.TargetGroupAttachment("gw", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: gwTargetGroup.arn,
})

new aws.lb.TargetGroupAttachment("web", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: webTargetGroup.arn,
})

// Internal ALB

export const internalAlb = new aws.lb.LoadBalancer("services", {
    accessLogs: {
        bucket: s3.accessLogsBucket.bucket,
        enabled: true,
        prefix: "load-balacing",
    },
    internal: true,
    subnets: vpc.vpc.privateSubnetIds,
    securityGroups: [vpc.sgServices.id],
    tags: {
        deployment: config.deploymentName,
    },
}, {
    dependsOn: s3.accessLogsBucketPolicy,
})

const registryTargetGroup = new aws.lb.TargetGroup("registry", {
    healthCheck: {
        path: "/",
    },
    port: 5000,
    protocol: "HTTP",
    vpcId: vpc.vpc.id,
    tags: {
        deployment: config.deploymentName,
    },
})

new aws.lb.Listener("internal-https", {
    certificateArn: acm.sslCert.arn,
    defaultActions: [{
        type: "forward",
        targetGroupArn: registryTargetGroup.arn,
    }],
    loadBalancerArn: internalAlb.arn,
    port: 443,
    protocol: "HTTPS",
    sslPolicy: "ELBSecurityPolicy-TLS-1-2-2017-01",
}, {
    deleteBeforeReplace: true,
})

new aws.lb.TargetGroupAttachment("registry", {
    targetId: ec2.servicesInstance.id,
    targetGroupArn: registryTargetGroup.arn,
})
