import json
import boto3
import pandas as pd
import openai
import os
import base64
import logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
BUCKET_NAME = 'csvcontainerassesment'

openai.api_key = os.environ['OPENAI_API_KEY']


def upload_file(file_content, file_name):
    decoded_file = base64.b64decode(file_content)
    s3_client.put_object(Bucket=BUCKET_NAME, Key=file_name, Body=decoded_file)


def process_data(file_name):
    local_file_path = f'/tmp/{file_name}'
    s3_client.download_file(BUCKET_NAME, file_name, local_file_path)

    df = pd.read_csv(local_file_path)
    df.drop_duplicates(inplace=True)

    processed_file_name = f'processed_{file_name}'
    processed_file_path = f'/tmp/{processed_file_name}'
    df.to_csv(processed_file_path, index=False)

    s3_client.upload_file(processed_file_path,
                          BUCKET_NAME, processed_file_name)
    return "File processed successfully"


def llm_summarize(file_name):
    local_file_path = f'/tmp/{file_name}'
    s3_client.download_file(BUCKET_NAME, file_name, local_file_path)

    df = pd.read_csv(local_file_path)
    text_to_summarize = df.to_string()

    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": f"Summarize the following data:\n{text_to_summarize}"},
        ]
    )
    return response['choices'][0]['message']['content']


def lambda_handler(event, context):
    logger.info(json.dumps(event))
    try:
        # Parse the body as JSON (if provided as a string)
        if isinstance(event.get('body'), str):
            event['body'] = json.loads(event['body'])  # Parse body string to JSON 
        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Request body is missing'})
            }

        # Extract action and file-name from the parsed body
        body = event.get('body', {})
        action = body.get('action')
        file_name = body.get('file-name')

        if not file_name:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'file-name not provided'})
            }

        if not action:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'action not provided'})
            }
            
        if action == 'upload':
            try:
                file_content = body['file_content']  # Expected to be base64 encoded
                upload_file(file_content, file_name)
                return {
                    'statusCode': 200,
                    'body': json.dumps({"message": "File uploaded successfully"})
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': f'Error during upload: {str(e)}'})
                }
        # Process the action
        elif action == 'process':
            try:
                process_data(file_name)
                return {
                    'statusCode': 200,
                    'body': json.dumps({"message": "Data processed successfully"})
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': f'Error during processing: {str(e)}'})
                }
        
        elif action == 'llm_summarize':
            try:
                summary = llm_summarize(file_name)
                return {
                    'statusCode': 200,
                    'body': json.dumps({"summary": summary})
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'body': json.dumps({'error': f'Error during summarization: {str(e)}'})
                }

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({"error": "Invalid action"})
            }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid JSON format in request body'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Unexpected error: {str(e)}'})
        }
