import { Component, OnInit, AfterViewInit } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import { MatDialog } from '@angular/material/dialog'
// import { ConfigurationsService,  } from '@ws-widget/utils'
import { IMAGE_MAX_SIZE, IMAGE_SUPPORT_TYPES } from '@ws/author/src/lib/constants/upload'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NotificationComponent } from '@ws/author/src/lib/modules/shared/components/notification/notification.component'
import { Notify } from '@ws/author/src/lib/constants/notificationMessage'
import { NOTIFICATION_TIME } from '@ws/author/src/lib/constants/constant'
import { LoaderService } from '../../../../../../../../../services/loader.service'
import { NSApiRequest } from '../../../../../../../../../interface/apiRequest'
import { AccessControlService } from '../../../../../../../../../modules/shared/services/access-control.service'
import { UploadService } from '../../../../../../shared/services/upload.service'
import { AUTHORING_BASE, CONTENT_BASE_STATIC } from '@ws/author/src/lib/constants/apiEndpoints'
import { HttpClient } from '@angular/common/http'
import { AuthInitService } from '@ws/author/src/lib/services/init.service'
import { EditorService } from '@ws/author/src/lib/routing/modules/editor/services/editor.service'
import { EditorContentService } from 'project/ws/author/src/lib/routing/modules/editor/services/editor-content.service'
import { ActivatedRoute } from '@angular/router'
import { of, Subscription } from 'rxjs'
import { NSContent } from '@ws/author/src/lib/interface/content'
import { CollectionStoreService } from './../../.././services/store.service'
import { CollectionResolverService } from './../../.././services/resolver.service'
import { IContentNode } from './../../.././interface/icontent-tree'
import { HeaderServiceService } from './../../../../../.././.././../.././../../../../.././src/app/services/header-service.service'
// import { ConfigurationsService } from '../../../../../../../../../../../../../library/ws-widget/utils/src/public-api'
import { ConfirmDialogComponent } from '@ws/author/src/lib/modules/shared/components/confirm-dialog/confirm-dialog.component'
import { ErrorParserComponent } from '@ws/author/src/lib/modules/shared/components/error-parser/error-parser.component'
import { isNumber } from 'lodash'
import { mergeMap, tap } from 'rxjs/operators'
import { CommentsDialogComponent } from '@ws/author/src/lib/modules/shared/components/comments-dialog/comments-dialog.component'
import * as _ from 'lodash'
import { Router } from '@angular/router'
import { environment } from '../../../../../../../../../../../../../.././src/environments/environment'
import { ConfigurationsService, ImageCropComponent } from '../../../../../../../../../../../../../.././library/ws-widget/utils/src/public-api'
import { SuccessDialogComponent } from '../../../../../../../../.././modules/shared/components/success-dialog/success-dialog.component'

@Component({
  selector: 'ws-author-module-creation',
  templateUrl: './module-creation.component.html',
  styleUrls: ['./module-creation.component.scss'],
  providers: [CollectionStoreService, CollectionResolverService],

})
export class ModuleCreationComponent implements OnInit, AfterViewInit {
  contents: NSContent.IContentMeta[] = []

  contentList: any[] = [
    {
      name: 'Link',
      icon: 'link'

    },
    {
      name: 'PDF',
      icon: 'picture_as_pdf'
    },
    {
      name: 'Audio',
      icon: 'music_note'
    },
    {
      name: 'Video',
      icon: 'videocam'
    },
    {
      name: 'SCORM',
      icon: 'cloud_upload'
    }
  ]

  accessList: any[] = [
    {
      name: 'Assessment',
      icon: 'assessment'
    },
    {
      name: 'Quiz',
      icon: 'smartphone'
    }
  ]

  showAddModuleForm: boolean = false
  moduleNames: any = [];
  isSaveModuleFormEnable: boolean = false
  moduleButtonName: string = 'Create';
  isResourceTypeEnabled: boolean = false
  isLinkPageEnabled: boolean = false
  isOnClickOfResourceTypeEnabled: boolean = false;
  resourceForm: FormGroup
  moduleForm!: FormGroup
  resourceImg: string = '';
  isLinkFieldEnabled: boolean = false;
  moduleName: string = '';
  topicDescription: string = ''
  resourceNames: any = [];
  resourceCount: number = 0;
  independentResourceNames: any = [];
  independentResourceCount: number = 0;
  imageTypes = IMAGE_SUPPORT_TYPES
  bucket: string = ''
  courseData: any
  isAssessmentOrQuizEnabled!: boolean
  assessmentOrQuizForm!: FormGroup
  isSettingsPage: boolean = false
  questionTypes: any = ['MCQ', 'Fill in the blanks', 'Match the following']
  currentContent!: string
  currentCourseId!: string
  viewMode = 'meta'
  routerSubscription: Subscription | null = null
  courseName: any
  currentParentId!: string
  checkCreator = false
  showResource: boolean = false;
  resourseSelected = ''
  triggerQuizSave = false
  triggerUploadSave = false
  isChanged = false
  versionKey: any
  versionID: any
  isSubmitPressed = false
  isMoveCourseToDraft: boolean = false;

  constructor(public dialog: MatDialog,
    private contentService: EditorContentService,
    private activateRoute: ActivatedRoute,
    private router: Router,

    // private configSvc: ConfigurationsService,
    private snackBar: MatSnackBar,
    private loader: LoaderService,
    private accessService: AccessControlService,
    private uploadService: UploadService,
    private http: HttpClient,
    private initService: AuthInitService,
    private editorService: EditorService,
    private editorStore: EditorContentService,
    private storeService: CollectionStoreService,
    private resolverService: CollectionResolverService,
    private headerService: HeaderServiceService,
    private _configurationsService: ConfigurationsService,

  ) {
    this.resourceForm = new FormGroup({
      resourceName: new FormControl(''),
      resourceLinks: new FormControl(''),
      appIcon: new FormControl('')
    })
    this.moduleForm = new FormGroup({
      appIcon: new FormControl('')
    })

    this.assessmentOrQuizForm = new FormGroup({
      resourceName: new FormControl(''),
    })
  }

  ngOnInit() {
    this.isSettingsPage = false
    this.routerValuesCall()

  }
  routerValuesCall() {
    this.contentService.changeActiveCont.subscribe(data => {
      this.currentContent = data
      this.currentCourseId = data
      if (this.contentService.getUpdatedMeta(data).contentType !== 'Resource') {
        this.viewMode = 'meta'
      }
    })
    if (this.activateRoute.parent && this.activateRoute.parent.parent) {
      this.routerSubscription = this.activateRoute.parent.parent.data.subscribe(data => {

        this.courseName = data.contents[0].content.name

        const contentDataMap = new Map<string, NSContent.IContentMeta>()

        data.contents.map((v: { content: NSContent.IContentMeta; data: any }) => {
          this.storeService.parentNode.push(v.content.identifier)
          this.resolverService.buildTreeAndMap(
            v.content,
            contentDataMap,
            this.storeService.flatNodeMap,
            this.storeService.uniqueIdMap,
            this.storeService.lexIdMap,
          )
        })
        contentDataMap.forEach(content => this.contentService.setOriginalMeta(content))
        const currentNode = (this.storeService.lexIdMap.get(this.currentContent) as number[])[0]

        this.currentParentId = this.currentContent
        this.storeService.treeStructureChange.next(
          this.storeService.flatNodeMap.get(currentNode) as IContentNode,
        )
        this.storeService.currentParentNode = currentNode
        this.storeService.currentSelectedNode = currentNode
        let newCreatedNode = 0
        const newCreatedLexid = this.editorService.newCreatedLexid
        if (newCreatedLexid) {
          newCreatedNode = (this.storeService.lexIdMap.get(newCreatedLexid) as number[])[0]
          this.storeService.selectedNodeChange.next(newCreatedNode)
        }

        if (data.contents[0] && data.contents[0].content && data.contents[0].content.children[0] &&
          data.contents[0].content.children[0].identifier) {
          this.subAction({
            type: 'editContent', identifier: data.contents[0].content.identifier, nodeClicked: true
          })
          this.storeService.selectedNodeChange.next(data.contents[0].content.identifier)
        }

      })

      this.activateRoute.parent.url.subscribe(data => {
        const urlParam = data[0].path
        if (urlParam === 'collection') {
          this.headerService.showCreatorHeader(this.courseName)
        }

      })
    }
  }
  subAction(event: { type: string; identifier: string, nodeClicked?: boolean }) {
    // const nodeClicked = event.nodeClicked
    this.contentService.changeActiveCont.next(event.identifier)
    switch (event.type) {
      case 'editMeta':
        this.viewMode = 'meta'
        break
      case 'editContent':
        if (event.nodeClicked === false) {
        }
        const content = this.contentService.getUpdatedMeta(event.identifier)
        if (['application/pdf', 'application/x-mpegURL', 'application/vnd.ekstep.html-archive', 'audio/mpeg', 'video/mp4'].includes(content.mimeType)) {
          this.viewMode = 'upload'
          // } else if (['video/x-youtube', 'text/x-url', 'application/html'].includes(content.mimeType) && content.fileType === 'link') {
        } else if (['video/x-youtube', 'text/x-url', 'application/html'].includes(content.mimeType) && content.fileType === '') {
          this.viewMode = 'curate'
        } else if (content.mimeType === 'application/html') {
          this.viewMode = 'upload'
        } else if (content.mimeType === 'application/quiz' || content.mimeType === 'application/json') {
          this.viewMode = 'assessment'
        } else if (content.mimeType === 'application/web-module') {
          this.viewMode = 'webmodule'
        } else {
          this.viewMode = 'meta'
        }
        break
    }
  }
  action(type: string) {      // recheck
    console.log('came here', type)
    switch (type) {
      case 'next':
        this.viewMode = 'meta'
        break

      case 'refresh':
        window.location.reload()
        break

      case 'scroll':

        const el = document.getElementById('edit-meta')
        if (el) {
          el.scrollIntoView()
        }

        break

      case 'save':
        this.save('save')
        this.showResource = true
        break

      case 'saveAndNext':
        this.save('next')
        break

      // case 'preview':
      //   this.preview(this.currentContent)
      //   break

      case 'push':

        if (this.getAction() === 'publish') {
          const dialogRefForPublish = this.dialog.open(ConfirmDialogComponent, {
            width: '70%',
            data: 'publishMessage',
          })
          dialogRefForPublish.afterClosed().subscribe(result => {
            if (result) {
              this.takeAction()
            }
          })
        } else {
          this.takeAction('acceptConent')
        }
        break

      // case 'delete':
      //   const dialog = this.dialog.open(DeleteDialogComponent, {
      //     width: '600px',
      //     height: 'auto',
      //     data: this.contentService.getUpdatedMeta(this.currentParentId),
      //   })
      //   dialog.afterClosed().subscribe(confirm => {
      //     if (confirm) {
      //       this.contents = this.contents.filter(v => v.identifier !== this.currentParentId)
      //       if (this.contents.length) {
      //         this.contentService.changeActiveCont.next(this.contents[0].identifier)
      //       } else {
      //         this.router.navigateByUrl('/author/home')
      //       }
      //     }
      //   })
      //   break

      // case 'fullscreen':
      //   this.fullScreenToggle()
      //   break

      // case 'close':
      //   this.router.navigateByUrl('/author/home')
      //   break

      case 'acceptConent':
        this.takeAction('acceptConent')
        break

      case 'rejectContent':
        this.takeAction('rejectContent')
        break
    }
  }
  getAction(): string {
    switch (this.contentService.originalContent[this.currentParentId].status) {
      case 'Draft':
      case 'Live':
        return 'sendForReview'
      case 'InReview':
        return 'review'
      case 'Reviewed':
        const isDraftPresent = this.contentService.resetStatus()
        /**Change all content as draft, if one of the content is draft status */
        if (isDraftPresent) {
          this.contentService.changeStatusDraft()
          return 'sendForReview'
        }
        return 'publish'
      default:
        return 'sendForReview'
    }
  }
  async save(nextAction?: string) {
    if (this.resourseSelected !== '') {

      this.update()
    }
    const updatedContent = this.contentService.upDatedContent || {}
    if (this.viewMode === 'assessment') {
      this.triggerQuizSave = true
    } else
      if (this.viewMode === 'upload') {
        // TODO  console.log('viewmode', this.viewMode)
        this.triggerUploadSave = true
      }

    if (
      (Object.keys(updatedContent).length &&
        (Object.values(updatedContent).length && JSON.stringify(Object.values(updatedContent)[0]) !== '{}')) ||
      Object.keys(this.storeService.changedHierarchy).length
    ) {

      this.isChanged = true
      this.loader.changeLoad.next(true)
      if (this.contentService.getUpdatedMeta(this.currentCourseId).contentType !== "CourseUnit") {
        this.versionID = await this.editorService.readcontentV3(this.currentCourseId).toPromise()
        this.versionKey = this.contentService.getUpdatedMeta(this.currentCourseId)
      }

      this.triggerSave().subscribe(
        () => {
          if (nextAction) {

            this.action(nextAction)
          }
          this.loader.changeLoad.next(false)
          this.snackBar.openFromComponent(NotificationComponent, {
            data: {
              type: Notify.SAVE_SUCCESS,
            },
            duration: NOTIFICATION_TIME * 1000,
          })
          console.log("push save")
          // this.isSettingsPage = false
          this.action("push")
        },
        (error: any) => {
          if (error.status === 409) {
            const errorMap = new Map<string, NSContent.IContentMeta>()
            Object.keys(this.contentService.originalContent).forEach(v =>
              errorMap.set(v, this.contentService.originalContent[v]),
            )
            const dialog = this.dialog.open(ErrorParserComponent, {
              width: '80vw',
              height: '90vh',
              data: {
                errorFromBackendData: error.error,
                dataMapping: errorMap,
              },
            })
            dialog.afterClosed().subscribe(v => {
              if (v) {
                if (typeof v === 'string') {
                  this.storeService.selectedNodeChange.next(
                    (this.storeService.lexIdMap.get(v) as number[])[0],
                  )
                  this.contentService.changeActiveCont.next(v)
                } else {
                  this.storeService.selectedNodeChange.next(v)
                  this.contentService.changeActiveCont.next(
                    this.storeService.uniqueIdMap.get(v) as string,
                  )
                }
              }
            })
          }
          this.loader.changeLoad.next(false)
          this.snackBar.openFromComponent(NotificationComponent, {
            data: {
              type: Notify.SAVE_FAIL,
            },
            duration: NOTIFICATION_TIME * 1000,
          })
        },
      )
    } else {
      if (nextAction) {
        console.log("nextAction")
        if (this.isSettingsPage) {
          this.action("push")
        } else {
          this.action(nextAction)

        }
      } else {
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: Notify.UP_TO_DATE,
          },
          duration: NOTIFICATION_TIME * 1000,
        })
      }
    }
  }
  triggerSave() {
    const nodesModified: any = {}
    let isRootPresent = false
    console.log(this.contentService.upDatedContent)
    Object.keys(this.contentService.upDatedContent).forEach(v => {
      if (!isRootPresent) {
        isRootPresent = this.storeService.parentNode.includes(v)
      }
      nodesModified[v] = {
        isNew: false,
        root: this.storeService.parentNode.includes(v),
        metadata: this.contentService.upDatedContent[v],
      }
    })
    if (!isRootPresent) {
      nodesModified[this.currentParentId] = {
        isNew: false,
        root: true,
        metadata: {},
      }
    }

    if (Object.keys(this.contentService.upDatedContent).length > 0 && nodesModified[this.currentCourseId]) {
      let tempUpdateContent = this.contentService.upDatedContent[this.currentCourseId]
      let requestBody: NSApiRequest.IContentUpdateV2

      if (tempUpdateContent.category === 'CourseUnit' || tempUpdateContent.category === 'Collection') {
        tempUpdateContent.visibility = 'Parent'
      } else {
        tempUpdateContent.versionKey = this.versionID === undefined ? this.versionKey.versionKey : this.versionID.versionKey
      }

      requestBody = {
        request: {
          content: tempUpdateContent,
        }
      }
      console.log("requestBody", requestBody.request.content.trackContacts)
      requestBody.request.content = this.contentService.cleanProperties(requestBody.request.content)

      if (requestBody.request.content.duration === 0 || requestBody.request.content.duration) {
        requestBody.request.content.duration =
          isNumber(requestBody.request.content.duration) ?
            requestBody.request.content.duration.toString() : requestBody.request.content.duration
      }

      if (requestBody.request.content.category) {
        delete requestBody.request.content.category
      }

      if (requestBody.request.content.trackContacts && requestBody.request.content.trackContacts.length > 0) {
        requestBody.request.content.reviewer = JSON.stringify(requestBody.request.content.trackContacts)
        requestBody.request.content.reviewerIDs = []
        const tempTrackRecords: string[] = []
        requestBody.request.content.trackContacts.forEach(element => {
          tempTrackRecords.push(element.id)
        })
        requestBody.request.content.reviewerIDs = tempTrackRecords
        delete requestBody.request.content.trackContacts
      }
      if (requestBody.request.content.gatingEnabled && requestBody.request.content.gatingEnabled.length > 0) {

        requestBody.request.content.gatingEnabled = JSON.stringify(requestBody.request.content.gatingEnabled)
        delete requestBody.request.content.gatingEnabled
      }

      if (requestBody.request.content.publisherDetails && requestBody.request.content.publisherDetails.length > 0) {
        requestBody.request.content.publisherIDs = []
        const tempPublisherRecords: string[] = []
        requestBody.request.content.publisherDetails.forEach(element => {
          tempPublisherRecords.push(element.id)
        })
        requestBody.request.content.publisherIDs = tempPublisherRecords
      }
      if (requestBody.request.content.creatorContacts && requestBody.request.content.creatorContacts.length > 0) {
        requestBody.request.content.creatorIDs = []
        const tempCreatorsRecords: string[] = []
        requestBody.request.content.creatorContacts.forEach(element => {
          tempCreatorsRecords.push(element.id)
        })
        requestBody.request.content.creatorIDs = tempCreatorsRecords
      }
      if (requestBody.request.content.catalogPaths && requestBody.request.content.catalogPaths.length > 0) {
        requestBody.request.content.topics = []
        const tempTopicData: string[] = []
        requestBody.request.content.catalogPaths.forEach((element: any) => {
          tempTopicData.push(element.identifier)
        })
        requestBody.request.content.topics = tempTopicData
      }

      this.contentService.currentContentData = requestBody.request.content
      this.contentService.currentContentID = this.currentCourseId

      //let nodesModified = {}
      console.log("requestBody", requestBody)

      if (tempUpdateContent.category === 'Resource' || tempUpdateContent.category === undefined || tempUpdateContent.category === 'Course') {
        return this.editorService.updateNewContentV3(_.omit(requestBody, ['resourceType']), this.currentCourseId).pipe(
          tap(() => {
            this.storeService.changedHierarchy = {}
            Object.keys(this.contentService.upDatedContent).forEach(id => {
              this.contentService.resetOriginalMeta(this.contentService.upDatedContent[id], id)
            })
            this.contentService.upDatedContent = {}
          })
        )
      } else {

      }

    }

    const requestBodyV2: NSApiRequest.IContentUpdateV3 = {
      request: {
        data: {
          nodesModified: this.contentService.getNodeModifyData(),
          hierarchy: this.storeService.getTreeHierarchy(),
        },
      },
    }


    return this.editorService.updateContentV4(requestBodyV2).pipe(
      tap(() => {

        this.storeService.changedHierarchy = {}
        Object.keys(this.contentService.upDatedContent).forEach(async id => {
          this.contentService.resetOriginalMeta(this.contentService.upDatedContent[id], id)
        })
        this.editorService.readcontentV3(this.contentService.parentContent).subscribe((data: any) => {
          this.contentService.resetOriginalMetaWithHierarchy(data)
        })
        this.contentService.upDatedContent = {}
      }),
    )


  }
  async update() {
    console.log("update")
    this.resourseSelected = ''
    const requestBodyV2: NSApiRequest.IContentUpdateV3 = {
      request: {
        data: {
          nodesModified: this.contentService.getNodeModifyData(),
          hierarchy: this.storeService.getTreeHierarchy(),
        },
      },
    }
    await this.editorService.updateContentV4(requestBodyV2).subscribe(() => {
      this.editorService.readcontentV3(this.contentService.parentContent).subscribe((data: any) => {
        this.contentService.resetOriginalMetaWithHierarchy(data)
        // tslint:disable-next-line: align
      })
    })
  }
  get validationCheck(): boolean {
    const currentNodeId = this.storeService.lexIdMap.get(this.currentParentId) as number[]
    let returnValue = this.storeService.validationCheck(currentNodeId[0])

    // console.log('returnvalue ', returnValue)

    // returnValue = null

    if (returnValue) {
      const dialog = this.dialog.open(ErrorParserComponent, {
        width: '80vw',
        height: '90vh',
        data: {
          processErrorData: returnValue,
        },
      })
      dialog.afterClosed().subscribe(v => {
        if (v) {
          if (typeof v === 'string') {
            this.storeService.selectedNodeChange.next(
              (this.storeService.lexIdMap.get(v) as number[])[0],
            )
            this.contentService.changeActiveCont.next(v)
          } else {
            this.storeService.selectedNodeChange.next(v)
            this.contentService.changeActiveCont.next(
              this.storeService.uniqueIdMap.get(v) as string,
            )
          }
        }
      })
      return false
    }
    return true
  }
  takeAction(contentAction?: string) {
    this.isSubmitPressed = true

    if (this.validationCheck) {

      this.editorService.readcontentV3(this.contentService.parentContent).subscribe((resData: any) => {
        if (resData && Object.keys(resData).length > 0) {
          resData.creatorContacts =
            this.jsonVerify(resData.creatorContacts) ? JSON.parse(resData.creatorContacts) : []
          resData.trackContacts =
            this.jsonVerify(resData.reviewer) ? JSON.parse(resData.reviewer) : []
          resData.gatingEnabled =
            this.jsonVerify(resData.gatingEnabled) ? JSON.parse(resData.gatingEnabled) : []
          resData.creatorDetails =
            this.jsonVerify(resData.creatorDetails) ? JSON.parse(resData.creatorDetails) : []
          resData.publisherDetails = this.jsonVerify(resData.publisherDetails) ?
            JSON.parse(resData.publisherDetails) : []
          if (resData.children.length > 0) {
            resData.children.forEach((element: any) => {
              element.creatorContacts = this.jsonVerify(element.creatorContacts) ? JSON.parse(element.creatorContacts) : []
              element.trackContacts = this.jsonVerify(element.reviewer) ? JSON.parse(element.reviewer) : []
              element.creatorDetails = this.jsonVerify(element.creatorDetails) ? JSON.parse(element.creatorDetails) : []
              element.publisherDetails = this.jsonVerify(element.publisherDetails) ? JSON.parse(element.publisherDetails) : []
            })
          }
          this.contentService.setOriginalMeta(resData)
        }
      })
      if (contentAction !== 'publishResources') {
        const dialogRef = this.dialog.open(CommentsDialogComponent, {
          width: '750px',
          height: '450px',
          data: this.contentService.getOriginalMeta(this.currentParentId),
        })

        // dialogRef.afterClosed().subscribe((commentsForm: FormGroup) => {
        //   this.finalCall(commentsForm)
        // })
        dialogRef.afterClosed().subscribe((d) => {
          // this.finalCall(contentAction)
          if (d) {
            if (this.getAction() === 'sendForReview' && d.value.action === 'reject') {
              contentAction = 'rejectContent'
              this.finalCall(contentAction)
            } else {
              this.finalCall(contentAction)
            }
          }
        })
      }
      if (contentAction === 'publishResources') {
        console.log("here", this.getAction())

        this.finalCall(contentAction)
      }
    }



  }
  async finalCall(contentActionTaken: any) {

    let flag = 0
    const resourceListToReview: any = []
    const moduleListToReview: any = []
    const updatedMeta = this.contentService.getUpdatedMeta(this.currentParentId)
    const originalData = this.contentService.getOriginalMeta(this.contentService.parentContent)
    if (contentActionTaken === 'acceptConent' || contentActionTaken === 'publishResources') {
      if (originalData && originalData.children && originalData.children.length > 0) {

        for (const element of originalData.children) {
          if (element.contentType === 'CourseUnit' || element.contentType === 'Collection') {
            if (element.children.length > 0) {
              element.children.forEach((subElement: any) => {
                const tempChildData = {
                  identifier: subElement.identifier,
                  status: subElement.status,
                  parentStatus: updatedMeta.status,
                  versionKey: subElement.versionKey,
                  reviewerStatus: subElement.reviewStatus,
                }
                resourceListToReview.push(tempChildData)
              })
            }
            const tempParentData = {
              identifier: element.identifier,
              status: element.status,
              parentStatus: updatedMeta.status,
              versionKey: element.versionKey,
            }
            moduleListToReview.push(tempParentData)

          } else {
            const tempData = {
              identifier: element.identifier,
              status: element.status,
              parentStatus: updatedMeta.status,
              versionKey: element.versionKey,
              reviewerStatus: element.reviewStatus,
            }
            resourceListToReview.push(tempData)
          }
        }

        if (originalData.reviewStatus === 'InReview' && originalData.status === 'Review') {
          // this.reviewerApproved(originalData, resourceListToReview)
        } else if (originalData.reviewStatus === 'Reviewed' && originalData.status === 'Review') {
          //this.contentPublish(originalData, resourceListToReview)
          // this.contentPublish(resourceListToReview)
        } else if (resourceListToReview.length > 0) {

          this.loader.changeLoad.next(true)
          for await (const element of resourceListToReview) {

            if ((element.status === 'Live' || element.status === 'Review') && updatedMeta.status === 'Draft') {
              flag += 1
            } else if ((element.status === 'Live') && updatedMeta.status === 'Review') {
              flag += 1
            } else {
              const requestPayload = {
                request: {
                  content: {
                    reviewStatus: 'InReview',
                    versionKey: element.versionKey,
                  },
                },
              }

              const reviewRes =
                await this.editorService.sendToReview(element.identifier, updatedMeta.status).toPromise().catch(_error => { })
              if (reviewRes && reviewRes.params && reviewRes.params.status === 'successful') {
                const updateContentRes =
                  await this.editorService.updateContentWithFewFields(requestPayload, element.identifier).toPromise().catch(_error => { })
                if (updateContentRes && updateContentRes.params && updateContentRes.params.status === 'successful') {
                  flag += 1
                } else {
                  flag -= 1
                }
              } else {
                flag -= 1
              }
            }
          }
          if (resourceListToReview.length === flag && moduleListToReview.length > 0) {
            const tempRequset: NSApiRequest.IContentUpdateV3 = {
              request: {
                data: {
                  //nodesModified: {},
                  nodesModified: this.contentService.getNodeModifyData(),
                  hierarchy: this.storeService.getTreeHierarchy(),
                },
              },
            }
            if (updatedMeta.status === 'Draft') {
              this.editorService.updateContentV4(tempRequset).subscribe(() => {
                // this.finalSaveAndRedirect(updatedMeta)
                // this.sendModuleToReviewOrPublish(moduleListToReview, updatedMeta)
              })
            } else {
              // this.finalSaveAndRedirect(updatedMeta)
            }
          } else if (resourceListToReview.length === flag) {
            this.dialog.closeAll()
            // this.loader.changeLoad.next(false)
            this.finalSaveAndRedirect(updatedMeta)
          } else {
            this.loader.changeLoad.next(false)
          }
        }
      }
    } else {
      console.log("yes here")
      // this.changeStatusToDraft('Content Rejected')
    }
  }
  finalSaveAndRedirect(updatedMeta: any) {
    const saveCall = (of({} as any)).pipe(
      mergeMap(() =>
        this.editorService
          // .forwardBackward(
          //   body,
          //   this.currentParentId,
          //   this.contentService.originalContent[this.currentParentId].status,
          // )
          .sendToReview(updatedMeta.identifier, updatedMeta.status)
          .pipe(
            mergeMap(() => {
              // this.notificationSvc
              //   .triggerPushPullNotification(
              //     updatedMeta,
              //     body.comment,
              //     body.operation ? true : false,
              //   )
              // .pipe(
              //   catchError(() => {
              //     return of({} as any)
              //   }),
              // ),
              return of({} as any)
            }
            ),
          ),
      ),
    )
    this.loader.changeLoad.next(true)
    saveCall.subscribe(
      async () => {
        const requestPayload = {
          request: {
            content: {
              reviewStatus: 'InReview',
              versionKey: updatedMeta.versionKey,
            },
          },
        }
        const updateConentRes =
          await this.editorService.updateContentWithFewFields(requestPayload, updatedMeta.identifier).toPromise().catch(_error => { })
        if (updateConentRes && updateConentRes.params && updateConentRes.params.status === 'successful') {
          this.loader.changeLoad.next(false)
          this.snackBar.openFromComponent(NotificationComponent, {
            data: {
              type: this.getMessage('success'),
            },
            duration: NOTIFICATION_TIME * 1000,
          })
          await this.sendEmailNotification('sendForReview')
          this.contents = this.contents.filter(v => v.identifier !== this.currentParentId)
          if (this.contents.length) {
            this.contentService.changeActiveCont.next(this.contents[0].identifier)
          } else {
            this.loader.changeLoad.next(false)
            this.dialog.open(SuccessDialogComponent, {
              width: '450px',
              height: '300x',
              data: { 'message': 'Course Sent For Review', 'icon': 'check_circle', 'color': 'rgb(44, 185, 58)', 'backgroundColor': '#FFFFF', 'padding': '6px 11px 10px 6px !important' },
            })
            // this.router.navigate(['author', 'cbp'])
          }
        } else {
          this.loader.changeLoad.next(false)
          this.snackBar.openFromComponent(NotificationComponent, {
            data: {
              type: this.getMessage('failure'),
            },
            duration: NOTIFICATION_TIME * 1000,
          })
        }
      },
      (error: any) => {
        if (error.status === 409) {
          const errorMap = new Map<string, NSContent.IContentMeta>()
          Object.keys(this.contentService.originalContent).forEach(v =>
            errorMap.set(v, this.contentService.originalContent[v]),
          )
          const dialog = this.dialog.open(ErrorParserComponent, {
            width: '80vw',
            height: '90vh',
            data: {
              errorFromBackendData: error.error,
              dataMapping: errorMap,
            },
          })
          dialog.afterClosed().subscribe(v => {
            if (v) {
              if (typeof v === 'string') {
                this.storeService.selectedNodeChange.next(
                  (this.storeService.lexIdMap.get(v) as number[])[0],
                )
                this.contentService.changeActiveCont.next(v)
              } else {
                this.storeService.selectedNodeChange.next(v)
                this.contentService.changeActiveCont.next(
                  this.storeService.uniqueIdMap.get(v) as string,
                )
              }
            }
          })
        }
        this.loader.changeLoad.next(false)
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: this.getMessage('failure'),
          },
          duration: NOTIFICATION_TIME * 1000,
        })
      },
    )
  }
  async sendEmailNotification(actionType: string) {
    const originalData = this.contentService.getOriginalMeta(this.contentService.parentContent)
    const emailReqPayload = {
      contentState: actionType,
      contentLink: `${environment.cbpPortal}author/editor/${originalData.identifier}/collection`,
      contentName: (this._configurationsService.userProfile) ? this._configurationsService.userProfile.userName : '',
      sender: (this._configurationsService.userProfile) ? this._configurationsService.userProfile.email : '',
      recipientEmails: <any>[],
    }
    switch (actionType) {
      case 'sendForReview':
        let reviewerData: any[]
        if (typeof originalData.reviewer === 'string') {
          reviewerData = JSON.parse(originalData.reviewer)
        } else {
          reviewerData = originalData.reviewer
        }
        if (reviewerData && reviewerData.length > 0) {
          reviewerData.forEach((element: any) => {
            if (element.email) {
              emailReqPayload.recipientEmails.push(element.email)
            }
          })
        }
        break
      case 'sendForPublish':
        let publisherData: any[]
        if (typeof originalData.publisherDetails === 'string') {
          publisherData = JSON.parse(originalData.publisherDetails)
        } else {
          publisherData = originalData.publisherDetails
        }
        if (publisherData && publisherData.length > 0) {
          publisherData.forEach((element: any) => {
            if (element.email) {
              emailReqPayload.recipientEmails.push(element.email)
            }
          })
        }
        break
      case 'reviewFailed':
      case 'publishFailed':
      case 'publishCompleted':
        let creatorData: any[]
        if (typeof originalData.creatorContacts === 'string') {
          creatorData = JSON.parse(originalData.creatorContacts)
        } else {
          creatorData = originalData.creatorContacts
        }
        if (creatorData && creatorData.length > 0) {
          creatorData.forEach((element: any) => {
            if (element.email) {
              emailReqPayload.recipientEmails.push(element.email)
            }
          })
        }
        break
    }
    if (emailReqPayload.recipientEmails && emailReqPayload.recipientEmails.length > 0) {
      await this.editorService.sendEmailNotificationAPI(emailReqPayload).toPromise().catch(_error => { })
    }
  }
  getMessage(type: 'success' | 'failure') {
    if (type === 'success') {
      switch (this.contentService.originalContent[this.currentParentId].status) {
        case 'Draft':
        case 'Live':
          return Notify.SEND_FOR_REVIEW_SUCCESS
        case 'InReview':
          return Notify.REVIEW_SUCCESS
        case 'Reviewed':
        case 'Review':
          return Notify.PUBLISH_SUCCESS
        default:
          return ''
      }
    }
    switch (this.contentService.originalContent[this.currentParentId].status) {
      case 'Draft':
      case 'Live':
        return Notify.SEND_FOR_REVIEW_FAIL
      case 'InReview':
        return Notify.REVIEW_FAIL
      case 'Reviewed':
      case 'Review':
        return Notify.PUBLISH_FAIL
      default:
        return ''
    }
  }
  async changeStatusToDraft(comment: string) {
    //const originalData = this.contentService.getOriginalMeta(this.contentService.parentContent)
    const originalData = await this.editorService.readcontentV3(this.contentService.parentContent).toPromise()
    this.dialog.closeAll()
    const resourceListToReview: any = []
    const moduleListToReview: any = []
    originalData.children.forEach((element: any) => {
      if (element.contentType === 'CourseUnit' || element.contentType === 'Collection') {
        if (element.children.length > 0) {
          element.children.forEach((subElement: any) => {
            if (subElement.status === 'Review') {
              const tempChildData = {
                identifier: subElement.identifier,
                status: subElement.status,
                versionKey: subElement.versionKey,
              }
              resourceListToReview.push(tempChildData)
            }
          })
        }
        const tempParentData = {
          identifier: element.identifier,
          status: element.status,
          versionKey: element.versionKey,
        }
        moduleListToReview.push(tempParentData)
      } else {
        if (element.status === 'Review') {
          const tempData = {
            identifier: element.identifier,
            status: element.status,
            versionKey: element.versionKey,
          }
          resourceListToReview.push(tempData)
        }
      }
    })
    let flag = 0
    const updateContentReq: any = {
      request: {
        content: {
          reviewStatus: 'InReview',
          versionKey: 0,
        },
      },
    }
    if (resourceListToReview.length > 0) {
      const requestBody: any = {
        request: {
          content: {
            rejectComment: comment,
          },
        },
      }

      for await (const element of resourceListToReview) {
        this.loader.changeLoad.next(true)
        updateContentReq.request.content.versionKey = element.versionKey
        const updateContentRes =
          await this.editorService.updateContentForReviwer(updateContentReq, element.identifier).toPromise().catch(_error => { })
        if (updateContentRes && updateContentRes.params && updateContentRes.params.status === 'successful') {
          const rejectRes: any = await this.editorService.rejectContentApi(requestBody, element.identifier).toPromise().catch(_error => { })
          if (rejectRes && rejectRes.params && rejectRes.params.status === 'successful') {
            flag += 1
          } else {
            flag -= 1
          }
        } else {
          flag -= 1
        }
      }
      if (flag === resourceListToReview.length) {
        updateContentReq.request.content.versionKey = originalData.versionKey
        const tempRequset: NSApiRequest.IContentUpdateV3 = {
          request: {
            data: {
              nodesModified: this.contentService.getNodeModifyData(),
              hierarchy: this.storeService.getTreeHierarchy(),
            },
          },
        }
        const updateHierarchyRes = await this.editorService.updateHierarchyForReviwer(tempRequset).toPromise().catch(_error => { })
        if (updateHierarchyRes && updateHierarchyRes.params && updateHierarchyRes.params.status === 'successful') {
          const parentMetaRes =
            await this.editorService.updateContentForReviwer(updateContentReq, originalData.identifier).toPromise().catch(_error => { })
          if (parentMetaRes && parentMetaRes.params && parentMetaRes.params.status === 'successful') {
            const rejectParentRes: any =
              await this.editorService.rejectContentApi(requestBody, originalData.identifier).toPromise().catch(_error => { })
            if (rejectParentRes && rejectParentRes.params && rejectParentRes.params.status === 'successful') {
              this.loader.changeLoad.next(false)
              this.snackBar.openFromComponent(NotificationComponent, {
                data: {
                  type: Notify.SAVE_SUCCESS,
                },
                duration: NOTIFICATION_TIME * 1000,
              })
              if (originalData.reviewStatus === 'InReview' && originalData.status === 'Review') {
                await this.sendEmailNotification('reviewFailed')
              } else if (originalData.reviewStatus === 'Reviewed' && originalData.status === 'Review') {
                await this.sendEmailNotification('publishFailed')
              }
              this.dialog.open(SuccessDialogComponent, {
                width: '450px',
                height: '300x',
                data: { 'message': 'Course sent back to Creator’s Draft', 'icon': 'cached', 'color': 'white', 'backgroundColor': '#407BFF', 'padding': '5px 9px 8px 6px !important' },
              })
              if (!this.isMoveCourseToDraft) {
                this.router.navigate(['author', 'cbp'])
              }
              this.isMoveCourseToDraft = false
            } else {
              this.loader.changeLoad.next(false)
              this.snackBar.openFromComponent(NotificationComponent, {
                data: {
                  type: Notify.SAVE_FAIL,
                },
                duration: NOTIFICATION_TIME * 1000,
              })
            }
          } else {
            this.loader.changeLoad.next(false)
            this.snackBar.openFromComponent(NotificationComponent, {
              data: {
                type: Notify.SAVE_FAIL,
              },
              duration: NOTIFICATION_TIME * 1000,
            })
          }
        } else {
          this.loader.changeLoad.next(false)
          this.snackBar.openFromComponent(NotificationComponent, {
            data: {
              type: Notify.SAVE_FAIL,
            },
            duration: NOTIFICATION_TIME * 1000,
          })
        }
      } else {
        this.loader.changeLoad.next(false)
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: Notify.SAVE_FAIL,
          },
          duration: NOTIFICATION_TIME * 1000,
        })
      }
    } else if (originalData.status === 'Review') {
      const requestBody: any = {
        request: {
          content: {
            rejectComment: comment,
          },
        },
      }
      const updateRequestBody: any = {
        request: {
          content: {
            reviewStatus: 'InReview',
            versionKey: originalData.versionKey,
          },
        },
      }
      const updateRes: any =
        await this.editorService.updateContentForReviwer(updateRequestBody, originalData.identifier).toPromise().catch(_error => { })
      if (updateRes && updateRes.params && updateRes.params.status === 'successful') {
        this.editorService.rejectContentApi(requestBody, originalData.identifier).subscribe((parentData: any) => {
          if (parentData && parentData.params && parentData.params.status === 'successful') {
            this.loader.changeLoad.next(false)
            this.snackBar.openFromComponent(NotificationComponent, {
              data: {
                type: Notify.SAVE_SUCCESS,
              },
              duration: NOTIFICATION_TIME * 1000,
            })
            this.dialog.open(SuccessDialogComponent, {
              width: '450px',
              height: '300x',
              data: { 'message': 'Course sent back to Creator’s Draft', 'icon': 'cached', 'color': 'white', 'backgroundColor': '#407BFF', 'padding': '5px 9px 8px 6px !important' },
            })
            if (!this.isMoveCourseToDraft) {
              this.router.navigate(['author', 'cbp'])
            }
            this.isMoveCourseToDraft = false
          } else {

            this.loader.changeLoad.next(false)
            this.snackBar.openFromComponent(NotificationComponent, {
              data: {
                type: Notify.SAVE_FAIL,
              },
              duration: NOTIFICATION_TIME * 1000,
            })
          }
        },
          // tslint:disable-next-line: align
          _error => {
            this.loader.changeLoad.next(false)
            this.snackBar.openFromComponent(NotificationComponent, {
              data: {
                type: Notify.SAVE_FAIL,
              },
              duration: NOTIFICATION_TIME * 1000,
            })
          })
      } else {
        this.loader.changeLoad.next(false)
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: Notify.SAVE_FAIL,
          },
          duration: NOTIFICATION_TIME * 1000,
        })
      }
    } else {
      this.snackBar.openFromComponent(NotificationComponent, {
        data: {
          type: Notify.SAVE_FAIL,
        },
        duration: NOTIFICATION_TIME * 1000,
      })
    }
  }
  async contentPublish(resourceList: any) {
    this.loader.changeLoad.next(true)
    let flag = 0
    if (resourceList && resourceList.length > 0) {
      for await (const element of resourceList) {
        if (element.status === 'Live' && element.parentStatus === 'Review') {
          flag += 1
        } else if (element.reviewerStatus === 'Reviewed' && element.status === 'Review') {
          const publishRes = await this.editorService.publishContent(element.identifier).toPromise().catch(_error => {
            this.dialog.closeAll()
            this.snackBar.open(_error.statusText, undefined, { duration: 1000 })
          })
          if (publishRes && publishRes.params && publishRes.params.status === 'successful') {
            flag += 1
          } else {
            flag -= 1
          }
        }
      }
      if (flag === resourceList.length) {
        // const publishParentRes = await this.editorService.publishContent(metaData.identifier).toPromise().catch(_error => { })
        // if (publishParentRes && publishParentRes.params && publishParentRes.params.status === 'successful') {
        //   this.loader.changeLoad.next(false)
        //   this.snackBar.openFromComponent(NotificationComponent, {
        //     data: {
        //       type: Notify.SAVE_SUCCESS,
        //     },
        //     duration: NOTIFICATION_TIME * 1000,
        //   })
        //   await this.sendEmailNotification('publishCompleted')
        //   this.router.navigate(['author', 'cbp'])
        // } else {
        //   this.loader.changeLoad.next(false)
        //   this.snackBar.openFromComponent(NotificationComponent, {
        //     data: {
        //       type: Notify.SAVE_FAIL,
        //     },
        //     duration: NOTIFICATION_TIME * 1000,
        //   })
        // }
        // const tempRequset: NSApiRequest.IContentUpdateV3 = {
        //   request: {
        //     data: {
        //       nodesModified: this.contentService.getNodeModifyData(),
        //       hierarchy: this.storeService.getTreeHierarchy(),
        //     },
        //   },
        // }
        // let result = await this.editorService.updateHierarchyForReviwer(tempRequset).toPromise().catch(_error => { })

        //if (result.params.status === 'successful') {
        this.editorService.readcontentV3(this.contentService.parentContent).subscribe((data: any) => {
          /* tslint:disable-next-line */
          console.log(data)
          this.contentService.resetOriginalMetaWithHierarchy(data)
          this.initService.publishData(data)
          // tslint:disable-next-line: align
        })
        //}
        this.loader.changeLoad.next(false)

      } else {
        this.loader.changeLoad.next(false)
        this.snackBar.open('The status of the resources present in the course is not correct, please retire the course and start over again', undefined, { duration: 3000 })
        // this.snackBar.openFromComponent(NotificationComponent, {
        //   data: {
        //     type: Notify.SAVE_FAIL,
        //   },
        //   duration: NOTIFICATION_TIME * 1000,
        // })
      }
    }
  }
  async reviewerApproved(metaData: NSContent.IContentMeta, resourceList: any) {
    this.loader.changeLoad.next(true)
    let flag = 0
    if (resourceList && resourceList.length > 0) {
      const requestPayload = {
        request: {
          content: {
            reviewStatus: 'Reviewed',
            versionKey: 0,
          },
        },
      }
      for await (const element of resourceList) {
        requestPayload.request.content.versionKey = element.versionKey
        if (element.status === 'Live' && element.parentStatus === 'Review') {
          flag += 1
        } else if (element.reviewerStatus === 'InReview' && element.status === 'Review') {
          const updateRes =
            await this.editorService.updateContentForReviwer(requestPayload, element.identifier).toPromise().catch(_error => { })
          if (updateRes && updateRes.params && updateRes.params.status === 'successful') {
            flag += 1
          } else {
            flag -= 1
          }
        }
      }
      if (flag === resourceList.length) {
        requestPayload.request.content.versionKey = metaData.versionKey
        // const tempRequset: NSApiRequest.IContentUpdateV3 = {
        //   request: {
        //     data: {
        //       nodesModified: this.contentService.getNodeModifyData(),
        //       hierarchy: this.storeService.getTreeHierarchy(),
        //     },
        //   },
        // }
        // const updateHierarchyRes = await this.editorService.updateHierarchyForReviwer(tempRequset).toPromise().catch(_error => { })
        // if (updateHierarchyRes && updateHierarchyRes.params && updateHierarchyRes.params.status === 'successful') {
        const parentMetaRes =
          await this.editorService.updateContentForReviwer(requestPayload, metaData.identifier).toPromise().catch(_error => { })
        if (parentMetaRes && parentMetaRes.params && parentMetaRes.params.status === 'successful') {
          this.loader.changeLoad.next(false)
          this.snackBar.openFromComponent(NotificationComponent, {
            data: {
              type: Notify.SAVE_SUCCESS,
            },
            duration: NOTIFICATION_TIME * 1000,
          })
          await this.sendEmailNotification('sendForPublish')
          this.dialog.open(SuccessDialogComponent, {
            width: '450px',
            height: '300x',
            data: { 'message': 'Course Accepted and sent to Publisher', 'icon': 'check_circle', 'color': 'rgb(44, 185, 58)', 'backgroundColor': '#FFFFF', 'padding': '6px 11px 10px 6px !important' },
          })
          // this.router.navigate(['author', 'cbp'])
          // } else {
          //   this.loader.changeLoad.next(false)
          //   this.snackBar.openFromComponent(NotificationComponent, {
          //     data: {
          //       type: Notify.SAVE_FAIL,
          //     },
          //     duration: NOTIFICATION_TIME * 1000,
          //   })
          // }
        } else {
          this.loader.changeLoad.next(false)
          this.snackBar.openFromComponent(NotificationComponent, {
            data: {
              type: Notify.SAVE_FAIL,
            },
            duration: NOTIFICATION_TIME * 1000,
          })
        }
      } else {
        this.loader.changeLoad.next(false)
        this.snackBar.openFromComponent(NotificationComponent, {
          data: {
            type: Notify.SAVE_FAIL,
          },
          duration: NOTIFICATION_TIME * 1000,
        })
      }
    }
  }
  ngAfterViewInit() {
    console.log('dd')
    this.editorService.readcontentV3(this.editorStore.parentContent).subscribe((data: any) => {
      console.log(data)
      this.courseData = data
      this.isSaveModuleFormEnable = true
      //this.showAddModuleForm = true
      this.moduleName = data.name
      this.topicDescription = data.description

      //this.isResourceTypeEnabled = true
      console.log(this.isSaveModuleFormEnable)
      //this.editorStore.resetOriginalMetaWithHierarchy(data)
    })
  }

  moduleCreate(name: string, input1: string, input2: string) {
    console.log(input1, input2)
    let obj: any = {}
    if (this.moduleButtonName == 'Create') {
      obj["type"] = 'collection'
      obj["name"] = input1
      obj["description"] = input2
      this.moduleName = name
      this.isSaveModuleFormEnable = true
      this.moduleButtonName = 'Save'
      this.initService.createModuleUnit(obj)
    } else if (this.moduleButtonName == 'Save') {
      this.isResourceTypeEnabled = true
    }
  }

  createResourseContent(name: string): void {
    if (name == 'Link') {
      this.isLinkFieldEnabled = true
      this.isAssessmentOrQuizEnabled = false
    } else if (name == 'PDF') {
      this.isLinkFieldEnabled = false
      this.isAssessmentOrQuizEnabled = false
      this.resourceImg = 'cbp-assets/images/pdf-icon.svg'
    } else if (name == 'Audio') {
      this.isLinkFieldEnabled = false
      this.isAssessmentOrQuizEnabled = false
      this.resourceImg = 'cbp-assets/images/pdf-icon.svg'
    } else if (name == 'Vedio') {
      this.isLinkFieldEnabled = false
      this.isAssessmentOrQuizEnabled = false
      this.resourceImg = 'cbp-assets/images/vedio-img.svg'
    } else if (name == 'SCORM') {
      this.isLinkFieldEnabled = false
      this.isAssessmentOrQuizEnabled = false
      this.resourceImg = 'cbp-assets/images/SCROM-img.svg'
    } else if (name == 'Assessment') {
      this.isLinkFieldEnabled = false
      this.isAssessmentOrQuizEnabled = true
    }
    this.addResource()
    this.isLinkPageEnabled = true
    this.isResourceTypeEnabled = false
    this.isOnClickOfResourceTypeEnabled = true
  }

  addModule() {
    this.showAddModuleForm = true
    this.moduleNames.push({ name: 'Create Course' })
    this.moduleName = ''
  }

  addResource() {
    this.resourceCount = this.resourceCount + 1
    this.resourceNames.push({ name: 'Resource ' + this.resourceCount })
  }

  addIndependentResource() {
    this.showAddModuleForm = true
    this.isResourceTypeEnabled = true
    this.independentResourceCount = this.independentResourceCount + 1
    this.independentResourceNames.push({ name: 'Resource ' + this.independentResourceCount })
  }

  changeToDefaultImg($event: any) {
    $event.target.src = this._configurationsService.instanceConfig
      ? this._configurationsService.instanceConfig.logos.defaultContent
      : ''
  }

  uploadAppIcon(file: File) {
    const formdata = new FormData()
    const fileName = file.name.replace(/[^A-Za-z0-9.]/g, '')
    if (
      !(
        IMAGE_SUPPORT_TYPES.indexOf(
          `.${fileName
            .toLowerCase()
            .split('.')
            .pop()}`,
        ) > -1
      )
    ) {
      this.snackBar.openFromComponent(NotificationComponent, {
        data: {
          type: Notify.INVALID_FORMAT,
        },
        duration: NOTIFICATION_TIME * 1000,
      })
      return
    }

    if (file.size > IMAGE_MAX_SIZE) {
      this.snackBar.openFromComponent(NotificationComponent, {
        data: {
          type: Notify.SIZE_ERROR,
        },
        duration: NOTIFICATION_TIME * 1000,
      })
      return
    }

    const dialogRef = this.dialog.open(ImageCropComponent, {
      width: '70%',
      data: {
        isRoundCrop: false,
        imageFile: file,
        width: 265,
        height: 150,
        isThumbnail: true,
        imageFileName: fileName,
      },
    })
    dialogRef.afterClosed().subscribe({
      next: (result: File) => {
        if (result) {
          formdata.append('content', result, fileName)
          this.loader.changeLoad.next(true)

          let randomNumber = ''
          // tslint:disable-next-line: no-increment-decrement
          for (let i = 0; i < 16; i++) {
            randomNumber += Math.floor(Math.random() * 10)
          }

          const requestBody: NSApiRequest.ICreateImageMetaRequestV2 = {
            request: {
              content: {
                code: randomNumber,
                contentType: 'Asset',
                createdBy: this.accessService.userId,
                creator: this.accessService.userName,
                mimeType: 'image/jpeg',
                mediaType: 'image',
                name: fileName,
                language: ['English'],
                license: 'CC BY 4.0',
                primaryCategory: 'Asset',
              },
            },
          }

          this.http
            .post<NSApiRequest.ICreateMetaRequest>(
              `${AUTHORING_BASE}content/v3/create`,
              requestBody,
            )
            .subscribe(
              (meta: any) => {
                // return data.result.identifier
                this.uploadService
                  .upload(formdata, {
                    contentId: meta.result.identifier,
                    contentType: CONTENT_BASE_STATIC,
                  })

                  .subscribe(
                    data => {
                      if (data && data.name !== 'Error') {
                        this.loader.changeLoad.next(false)
                        //this.moduleForm.controls.appIcon.setValue(data.artifactUrl)
                        this.courseData.thumbnail = data.artifactUrl
                        this.initService.uploadData('thumbnail')
                      }
                    })
              })
        }
      }
    })
  }

  generateUrl(oldUrl: any) {
    //const chunk = oldUrl.split('/')
    //const newChunk = environment.azureHost.split('/')
    // @ts-ignore: Unreachable code error
    this.bucket = window["env"]["azureBucket"]
    if (oldUrl.includes(this.bucket)) {
      return oldUrl
    }

  }
  jsonVerify(s: string) { try { JSON.parse(s); return true } catch (e) { return false } }

}
