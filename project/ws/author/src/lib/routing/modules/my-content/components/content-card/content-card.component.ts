import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core'
import { AccessControlService } from '@ws/author/src/lib/modules/shared/services/access-control.service'
import { AuthInitService } from '@ws/author/src/lib/services/init.service'
import { Router } from '@angular/router'

@Component({
  selector: 'ws-auth-root-content-card',
  templateUrl: './content-card.component.html',
  styleUrls: ['./content-card.component.scss'],
})
export class ContentCardComponent implements OnInit {
  @Input() data: any
  @Input() ordinals: any
  @Input() forExpiry = false
  @Input() forDelete = false
  @Input() changeView = false
  filteredSubTitles: any[] = []
  translationArray: any = []
  userId!: string
  pageName = false
  @Output() action = new EventEmitter<any>()
  isBaseContent: Boolean = true
  constructor(private accessService: AccessControlService,
    private authInitService: AuthInitService,
    private router: Router) { }

  ngOnInit() {
    console.log((this.router.url).includes('published'))
    if ((this.router.url).includes('published')) {
      this.pageName = true
    }
    if (this.data.hasTranslations && this.data.hasTranslations.length) {
      this.translationArray = this.translationArray.concat(this.data.hasTranslations)
    }
    if (this.data.isTranslationOf && this.data.isTranslationOf.length) {
      this.isBaseContent = false
      this.translationArray = this.translationArray.concat(this.data.isTranslationOf)
    }
    this.filteredSubTitles = this.translationArray.length
      ? this.ordinals.subTitles.filter(
        (elem: any) => !this.translationArray.find((item: any) => elem.srclang === item.locale),
      )
      : this.ordinals.subTitles
    this.userId = this.accessService.userId
  }

  getName(lang: string): string {
    const language = this.ordinals.subTitles.find((v: any) => v.srclang === lang)
    return language ? language.label : lang
  }

  showMenuItem(menuType: string) {
    let returnValue = false
    switch (menuType) {
      case 'edit':
      case 'delete':
        if (this.data.status === 'Draft' || this.data.status === 'Live') {
          returnValue = this.accessService.hasAccess(this.data)
        }
        if (this.data.authoringDisabled && menuType === 'edit') {
          returnValue = false
        }
        break
      case 'moveToDraft':
        if (
          this.data.status === 'InReview' ||
          this.data.status === 'Unpublished' ||
          this.data.status === 'Reviewed' ||
          this.data.status === 'QualityReview'
        ) {
          returnValue = this.accessService.hasAccess({ ...this.data, status: 'Draft' })
        }
        break
      case 'moveToInReview':
        if (this.data.status === 'Reviewed' || this.data.status === 'QualityReview') {
          returnValue = this.accessService.hasAccess({ ...this.data, status: 'InReview' })
        }
        break
      case 'publish':
        // if (this.data.status === 'Reviewed') {
        if (this.data.reviewStatus === 'Reviewed' && this.data.status === 'Review') {
          returnValue = this.accessService.hasAccess(this.data)
        }
        break
      case 'unpublish':
        if (this.data.status === 'Live') {
          returnValue = this.accessService.hasAccess(this.data)
        }
        break
      case 'review':
        // if (this.data.status === 'Review' || this.data.status === 'QualityReview') {
        if (this.data.reviewStatus === 'InReview' && this.data.status === 'Review') {
          returnValue = this.accessService.hasAccess(this.data)
        }
        break
      case 'lang':
        returnValue = this.accessService.hasAccess({ ...this.data, status: 'Draft' })
        break
    }
    return returnValue
  }

  create(language: string) {
    this.action.emit({
      type: 'create',
      data: { ...this.data, locale: language },
    })
  }

  viewComments() {
    this.action.emit({
      type: 'comments',
    })
  }

  takeAction(actionType: string) {
    this.action.emit({
      type: actionType,
      data: this.data,
    })
  }

  editCourse(actionType: string) {
    this.authInitService.editCourse(actionType)
  }

  changeToDefaultImg($event: any) {
    $event.target.src = this.accessService.defaultLogo
  }
}
