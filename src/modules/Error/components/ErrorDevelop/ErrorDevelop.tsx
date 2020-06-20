import React, { useEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';

import { generateNumberArray } from '@utils/common';
import { loadingPlaceholder, media } from '@utils/mixin';

import { SentryIssueResponse } from './ErrorDevelop.types';
import { getErrorDetails, getFailureMessage } from './ErrorDevelop.helpers';

import { ReactComponent as OZiTAGLogo } from '@assets/svg/ozitag-logo.svg';

type Props = {
  errorId?: string;
  errorCode: number;
  errorName: string;
};

function ErrorDevelop({ errorId, errorCode, errorName }: Props) {
  const [fetchingState, setFetchingState] = useState<{
    isLoading: boolean;
    errorTitle: string | null;
    error: string | null;
  }>({
    isLoading: !!errorId,
    errorTitle: null,
    error: null,
  });

  const { isLoading, error, errorTitle } = fetchingState;

  const errorDetailsRef = useRef<SentryIssueResponse | null>(null);
  const errorDetailsCurrent = errorDetailsRef.current;

  const callStackLength = errorDetailsCurrent?.stacktrace.length;
  const [isCallStackCollapse, setCallStackCollapse] = useState(true);
  const [openedStackTraceCodeLines, setOpenedStackTraceCodeLines] = useState(
    []
  );
  const callStackAvailableLength = !isCallStackCollapse ? callStackLength : 3;

  function expandCallStack() {
    setCallStackCollapse(false);
  }

  function expandViewCode(number: any) {
    if (openedStackTraceCodeLines.indexOf(number as never) === -1) {
      setOpenedStackTraceCodeLines([
        ...(openedStackTraceCodeLines as never[]),
        number as never,
      ]);
    } else {
      setOpenedStackTraceCodeLines(
        openedStackTraceCodeLines.filter((item) => item !== number)
      );
    }
  }

  useEffect(() => {
    if (!errorId) return;
    if (error || errorDetailsCurrent) return;

    getErrorDetails(errorId)
      .then((response) => {
        errorDetailsRef.current = response;

        setFetchingState({
          ...fetchingState,
          isLoading: false,
        });
      })
      .catch((error) => {
        const code = error.status?.code;
        const message = error.body?.message;

        setFetchingState({
          error: getFailureMessage(code, message),
          errorTitle: code !== 404 ? 'Tager Sentry Response:' : null,
          isLoading: false,
        });
      });
  }, [error, errorDetailsCurrent, errorId, fetchingState]);

  let title, sentryUrl, file, stacktrace;

  if (errorDetailsCurrent) {
    title = errorDetailsCurrent.title;
    sentryUrl = errorDetailsCurrent.sentryUrl;
    file = errorDetailsCurrent.file;
    stacktrace = errorDetailsCurrent.stacktrace;
  }

  return (
    <Container>
      <Inner>
        <Card>
          <CardScroll>
            <CardInner>
              <Block>
                <ErrorName>
                  {!isLoading
                    ? `${errorCode} - ${errorName}`
                    : `Loading error details...`}
                </ErrorName>
                {!isLoading && !errorDetailsCurrent && errorId ? (
                  <ErrorID>Error ID: {errorId}</ErrorID>
                ) : null}
                {isLoading || title || error ? (
                  <ErrorMessage isLoading={isLoading}>
                    {errorTitle ? (
                      <ErrorMessageTitle>{errorTitle}</ErrorMessageTitle>
                    ) : null}
                    {title ?? error}
                  </ErrorMessage>
                ) : null}
                {sentryUrl ? (
                  <GetDetailsLink href={sentryUrl} target="_blank">
                    View on Sentry
                  </GetDetailsLink>
                ) : null}
              </Block>
              {isLoading || file ? (
                <Block>
                  <Title isLoading={isLoading}>Source</Title>
                  <SourceCode isLoading={isLoading}>
                    <File>{file}</File>
                  </SourceCode>
                </Block>
              ) : null}
              {isLoading || stacktrace ? (
                <Block>
                  <Title isLoading={isLoading}>Call Stack</Title>
                  {stacktrace ? (
                    <CallStack>
                      {stacktrace
                        .slice(0, callStackAvailableLength)
                        .map((item, index) => (
                          <CallStackItem key={index} isLoading={isLoading}>
                            <CallStackFunction>
                              {index + 1}. {item.function}
                            </CallStackFunction>
                            <CallStackFile>
                              {item.file} -{' '}
                              <CallStackFileLine>
                                Line {item.line}, Col {item.col}
                              </CallStackFileLine>
                            </CallStackFile>
                            <br />
                            <CallStackButton
                              onClick={() => expandViewCode(index)}
                            >
                              {openedStackTraceCodeLines.indexOf(
                                index as never
                              ) !== -1
                                ? 'Hide code'
                                : 'View code'}
                            </CallStackButton>
                            {openedStackTraceCodeLines.indexOf(
                              index as never
                            ) !== -1 ? (
                              <CallStackCode>
                                {item.code.map((codeLine: any) => (
                                  <CallStackCodeLine
                                    isActive={codeLine.line === item.line}
                                  >
                                    {codeLine.line}
                                    {codeLine.code}
                                  </CallStackCodeLine>
                                ))}
                              </CallStackCode>
                            ) : null}
                          </CallStackItem>
                        ))}
                      {isCallStackCollapse && stacktrace.length > 3 ? (
                        <CallStackButton onClick={expandCallStack}>
                          Show collapsed frames
                        </CallStackButton>
                      ) : null}
                    </CallStack>
                  ) : (
                    <CallStack>
                      {generateNumberArray(3).map((item, index) => (
                        <CallStackItem key={index} isLoading={isLoading} />
                      ))}
                    </CallStack>
                  )}
                </Block>
              ) : null}
            </CardInner>
          </CardScroll>
          <ErrorFooter>
            <FooterTager href="https://ozitag.com/tager" target="_blank">
              Made by <span>TAGER</span>
            </FooterTager>
            <FooterOZiTAG href="https://ozitag.com/" target="_blank">
              <OZiTAGLogo />
            </FooterOZiTAG>
          </ErrorFooter>
        </Card>
      </Inner>
    </Container>
  );
}

const Container = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  color: #262626;
  background-color: rgb(180, 180, 180);
`;

const Inner = styled.div`
  width: 100%;
  max-width: 720px;
`;

const Card = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: calc(100% - 20px);
  max-height: calc(100vh - 20px);
  margin: 0 auto;
  border-top: 5px solid #ff5555;
  border-radius: 5px;
  font-size: 16px;
  line-height: 24px;
  background-color: #fff;
  box-shadow: 0 5px 25px 1px rgba(0, 0, 0, 0.25);
`;

const CardScroll = styled.div`
  overflow-y: auto;
`;

const CardInner = styled.div`
  padding: 35px 30px;

  ${media.mobile(css`
    padding: 35px 15px;
  `)}
`;

const preloader = css`
  ${loadingPlaceholder};
  min-height: 24px;
  border-radius: 5px;
`;

const ErrorName = styled.span`
  position: relative;
  display: block;
  font-size: 24px;
  font-weight: 700;
`;

const ErrorID = styled.span`
  position: relative;
  display: block;
  margin-top: 10px;
  word-break: break-all;
  color: #999999;
`;

const ErrorMessageTitle = styled.span`
  display: block;
  font-weight: 700;
`;

const ErrorMessage = styled.span<{ isLoading: boolean }>`
  position: relative;
  display: block;
  margin-top: 10px;
  word-break: break-word;
  color: #ff5555;

  ${({ isLoading }) =>
    isLoading &&
    css`
      ${preloader};
      max-width: 500px;
    `}
`;

const GetDetailsLink = styled.a`
  display: inline-block;
  margin-top: 5px;
  text-decoration: underline;
  color: #5566ff;
`;

const Block = styled.div`
  &:not(:last-child) {
    margin-bottom: 30px;
  }
`;

const Title = styled.span<{ isLoading: boolean }>`
  display: block;
  font-size: 24px;

  &:not(:last-child) {
    margin-bottom: 20px;
  }

  ${({ isLoading }) =>
    isLoading &&
    css`
      ${preloader};
      max-width: 350px;
    `}
`;

const SourceCode = styled.code<{ isLoading: boolean }>`
  display: block;
  padding: 15px 25px;
  border-radius: 5px;
  background-color: #000;

  ${media.mobile(css`
    padding: 15px;
  `)}

  ${({ isLoading }) =>
    isLoading &&
    css`
      ${preloader};
      min-height: 78px;
    `}
`;

const File = styled.span`
  word-break: break-word;
  color: #b1b1b1;
`;

const CallStack = styled.ul`
  max-width: 620px;
`;

const CallStackItem = styled.li<{ isLoading: boolean }>`
  font-size: 14px;
  line-height: 22px;

  &:not(:last-child) {
    margin-bottom: 10px;
  }

  ${({ isLoading }) =>
    isLoading &&
    css`
      ${preloader};
      min-height: 48px;
    `}
`;

const CallStackFile = styled.span`
  word-break: break-word;
`;

const CallStackFileLine = styled.span`
  font-weight: 700;
`;

const CallStackFunction = styled.span`
  display: block;
  background: #fff;
  font-size: 16px;
  margin-bottom: 5px;
  font-weight: 700;
`;

const CallStackCode = styled.code`
  display: block;
  padding: 5px 0 5px 15px;
  word-break: break-word;
  color: #999999;
  overflow: auto;
`;

const CallStackButton = styled.code`
  display: inline-block;
  cursor: pointer;

  &:not(:hover) {
    text-decoration: underline;
  }
`;

const CallStackCodeLine = styled.div<{ isActive: boolean }>`
  white-space: nowrap;
  background: ${({ isActive }) => (isActive ? '#ececec' : 'transparent')};
`;

const CallStackToggle = styled.button``;

const ErrorFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding: 15px 20px;
  border-top: 1px solid rgb(230, 230, 230);

  ${media.mobile(css`
    padding: 15px;
  `)}
`;

const FooterTager = styled.a`
  display: flex;
  align-items: center;
  font-size: 15px;
  line-height: 22px;

  span {
    font-weight: 700;
    display: inline-block;
    margin-left: 6px;
    letter-spacing: 0.2em;
    font-size: 18px;
  }
`;

const FooterOZiTAG = styled.a`
  display: inline-block;
  height: 36px;

  svg {
    height: 36px;
  }
`;

export default ErrorDevelop;
