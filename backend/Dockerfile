FROM public.ecr.aws/lambda/python:3.9

COPY . /var/task

RUN pip install -r requirements.txt

WORKDIR /var/task

ENV OPENAI_API_KEY=""

CMD ["lambda_handler.lambda_handler"]
