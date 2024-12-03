import {
  Component, OnInit, Inject
} from '@angular/core'
import {
  MatDialogRef,
  MAT_DIALOG_DATA
} from '@angular/material/dialog'
import { EditorService } from '@ws/author/src/lib/routing/modules/editor/services/editor.service'
import { Router } from '@angular/router'
import { MatSnackBar } from '@angular/material/snack-bar'
import { NotificationComponent } from '@ws/author/src/lib/modules/shared/components/notification/notification.component'
import { Notify } from '@ws/author/src/lib/constants/notificationMessage'
import { NOTIFICATION_TIME } from '@ws/author/src/lib/constants/constant'
import { LoaderService } from '@ws/author/src/lib/services/loader.service'

@Component({
  selector: 'ws-competency-popup',
  templateUrl: './competency-popup.component.html',
  styleUrls: ['./competency-popup.component.scss']
})
export class CompetencyPopupComponent implements OnInit {
  proficiency: any
  proficiencyList: any
  selectLevel: any
  parentData: any
  levelList: any = [
    {
      selected: false,
      "value": "1",
      "name": "Level 1"
    },
    {
      selected: false,
      "value": "2",
      "name": "Level 2"
    },
    {
      selected: false,
      "value": "3",
      "name": "Level 3"
    },
    {
      selected: false,
      "value": "4",
      "name": "Level 4"
    },
    {
      selected: false,
      "value": "5",
      "name": "Level 5"
    }
  ]
  hasOneChecked: boolean = false
  selectedSelfAssessment: any
  disableLevel: boolean = false
  searchComp: any = ''
  constructor(
    private loader: LoaderService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<CompetencyPopupComponent>,
    private editorService: EditorService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) data: any,
  ) {
    this.selectedSelfAssessment = data
  }

  ngOnInit() {
    if (this.selectedSelfAssessment == true) {
      this.disableLevel = true
    }
    this.editorService.getAllEntities().subscribe(async (res: any) => {
      this.proficiencyList = await res.result.response
      this.searchComp = this.proficiencyList
    })
    const url = this.router.url
    const id = url.split('/')
    console.log("id: " + id)
    this.editorService.readcontentV3(id[3]).subscribe((res: any) => {
      this.parentData = res
    })

  }
  eventSelection(event: any) {
    this.proficiency = event
  }

  listSelection(levelList: any, i: number, $event: any) {

    levelList[i].selected = $event.checked
    this.selectLevel = levelList

    let vendor = levelList.filter((level: any) => level['selected'] === true)
    if (vendor.length > 0) {
      this.hasOneChecked = true
    } else {
      this.hasOneChecked = false
    }

  }
  addCompetency(proficiency: any, selectLevel: any, onclose: boolean) {
    let level = []
    if (!this.disableLevel) {
      level = selectLevel.filter((level: any) => level['selected'] === true)
    }
    let isDuplicate = false
    if (onclose) {
      let competencyID
      let arr1: string[] = []
      let arr2: { competencyName: any; competencyId: any; level: any }[] = []
      // let arr3: { competencyName: any; competencyId: any }[] = []
      var filteredComps: { competencyName: any; competencyId: any; level: any }[] = []
      var filteredComp: { competencyName: any; competencyId: any }[] = []
      let competencies_obj
      if (this.parentData.competencies_v1 && this.parentData.competencies_v1 === undefined) {
        if (level.length > 0) {
          level.forEach((item: any) => {
            competencyID = proficiency.id + '-' + item.value
            arr1.push(competencyID)
            competencies_obj = {
              competencyName: proficiency.name,
              competencyId: proficiency.id.toString(),
              level: item.value
            }
            filteredComps.push(competencies_obj)
          })
        } else {
          competencyID = proficiency.id
          arr1.push(competencyID)
          filteredComp = []
          competencies_obj = {
            competencyName: proficiency.name,
            competencyId: proficiency.id.toString(),
          }
          filteredComp.push(competencies_obj)

          // arr3.push(competencies_obj)

        }

      } else {
        arr2 = this.parentData.competencies_v1 ? JSON.parse(this.parentData.competencies_v1) : []
        if (arr2.length > 0) {
          filteredComps = arr2.filter((com: any) => (com['level'] > 0))
        }
        // arr3 = this.parentData.competencies_v1 ? JSON.parse(this.parentData.competencies_v1) : []
        if (this.parentData.competencySearch) {
          arr1 = this.parentData.competencySearch
        }
        if (level.length > 0) {
          level.forEach((item: any) => {
            let duplicateCompetency = arr2.filter((com: any) => (com['competencyId'] === proficiency.id && com['level'] === item.value))
            if (duplicateCompetency.length > 0) {
              isDuplicate = true
              this.snackBar.openFromComponent(NotificationComponent, {
                data: {
                  type: Notify.INVALID_COMPETENCY,
                },
                duration: NOTIFICATION_TIME * 1000,
              })
            }


            competencyID = proficiency.id + '-' + item.value
            arr1.push(competencyID)
            competencies_obj = {
              competencyName: proficiency.name,
              competencyId: proficiency.id.toString(),
              level: item.value
            }
            filteredComps.push(competencies_obj)
          })
        } else {
          console.log("arr2", arr2)
          let duplicateCompetency = arr2.filter((com: any) => (com['competencyId'] === proficiency.id))
          if (duplicateCompetency.length > 0) {
            isDuplicate = true
            this.snackBar.openFromComponent(NotificationComponent, {
              data: {
                type: Notify.INVALID_COMPETENCY,
              },
              duration: NOTIFICATION_TIME * 1000,
            })
          }
          filteredComp = []

          competencyID = proficiency.id
          // arr1.push(competencyID)
          competencies_obj = {
            competencyName: proficiency.name,
            competencyId: proficiency.id.toString(),
          }
          filteredComp.push(competencies_obj)
        }

      }

      let requestBody: any
      let meta: any
      if (!this.disableLevel) {
        meta = {
          versionKey: this.parentData.versionKey,
          selfAssessment: false,
          competencySearch: arr1,
          competency: false,
          competencies_v1: filteredComps
        }
      } else {
        meta = {
          versionKey: this.parentData.versionKey,
          selfAssessment: true,
          competencySearch: "",
          competency: true,
          competencies_v1: filteredComp
        }
      }



      requestBody = {
        request: {
          content: meta
        }
      }
      if (!isDuplicate) {
        this.loader.changeLoad.next(true)
        this.editorService.updateNewContentV3(requestBody, this.parentData.identifier).subscribe(
          (response: any) => {
            if (response.params.status === "successful") {
              this.dialogRef.close(onclose)
            }
          })
      }

    } else {
      this.dialogRef.close(onclose)
    }
  }


  onKey(value: string) {
    this.proficiencyList = this.search(value)
  }

  search(value: string) {
    let filter = value.toLowerCase()
    if (!filter) {
      return this.searchComp
    }
    return this.proficiencyList = this.searchComp.filter((option: any) =>
      option.name.toLowerCase().includes(filter)
    )
  }
}
