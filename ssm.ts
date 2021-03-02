import * as aws from "@pulumi/aws"

import * as config from "./config"

export const runMigrationDocument = new aws.ssm.Document("RunCodeOceanMigration", {
    content: `{
        "schemaVersion": "2.2",
        "description": "Run Code Ocean data migration",
        "parameters": {
            "dryRun": {
              "type": "String",
              "description": "(Optional) Dry run mode",
              "default": "true",
              "allowedValues": ["true", "false"]
            }
        },
        "mainSteps": [{
            "action": "aws:runShellScript",
            "name": "runShellScript",
            "inputs": {
                "runCommand": [
                    "#!/bin/bash",
                    "set -ex",
                    "echo Script started at $(date --iso-8601=ns)",
                    "until test -f /var/run/codeocean; do sleep 1; done",
                    "until $(curl --output /dev/null --silent --fail localhost:8300/health); do sleep 5; done",
                    "sleep 5",
                    "JOB_ID=$(curl -s -X POST localhost:8300/migrate?dry_run={{dryRun}})",
                    "JOB_ID=$(echo $JOB_ID | xargs)",
                    "echo -n Migrating...",
                    "STATUS=$(curl -s \\"localhost:8105/jobs/$JOB_ID\\" | jq -r .job_status)",
                    "while [ $STATUS != \\"completed\\" -a $STATUS != \\"failed\\" ]; do",
                    "    sleep 1",
                    "    echo -n .",
                    "    STATUS=$(curl -s \\"localhost:8105/jobs/$JOB_ID\\" | jq -r .job_status)",
                    "done",
                    "echo",
                    "if [ $STATUS == \\"completed\\" ]; then",
                    "    echo Done!",
                    "else",
                    "    RESULT=$(curl -s \\"localhost:8105/jobs/$JOB_ID\\")",
                    "    echo -n \\"Performed migrations: \\"",
                    "    echo $(echo $RESULT | jq -r .result.performed_migrations)",
                    "    echo -n \\"Failed migration: \\"",
                    "    echo $(echo $RESULT | jq -r .result.failed_migration)",
                    "    echo -n \\"Error: \\"",
                    "    echo $(echo $RESULT | jq -r .result.error)",
                    "    exit 1",
                    "fi",
                    "echo Script ended at $(date --iso-8601=ns)"
                ]
            }
        }]
    }`,
    documentType: "Command",
    tags: {
        deployment: config.deploymentName,
    },
})

export const runInitSystemDataDocument = new aws.ssm.Document("CodeOceanInitializeSystemData", {
    content: `{
        "schemaVersion": "2.2",
        "description": "Run Code Ocean system data initialization",
        "mainSteps": [{
            "action": "aws:runShellScript",
            "name": "runShellScript",
            "inputs": {
                "runCommand": [
                    "#!/bin/bash",
                    "set -ex",
                    "echo Script started at $(date --iso-8601=ns)",
                    "until test -f /var/run/codeocean; do sleep 1; done",
                    "curl -sS -X POST localhost:8880/api/init_data?all=true",
                    "echo Script ended at $(date --iso-8601=ns)"
                ]
            }
        }]
    }`,
    documentType: "Command",
    tags: {
        deployment: config.deploymentName,
    },
})
